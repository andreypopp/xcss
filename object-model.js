"use strict";
/**
 * XCSS object model
 */

var stringify   = require('css-stringify');
var flatMap     = require('flatmap');

function Stylesheet(rules) {
  this.type = 'stylesheet';
  this.rules = rules;

  if (process.env.NODE_ENV !== 'production') {
    var deepFreeze  = require('deep-freeze');
    deepFreeze(this);
  }
}

Stylesheet.prototype.removePlaceholders = function() {
  return new Stylesheet(removePlaceholderRules(this.rules));
}

Stylesheet.prototype.flatten = function() {
  return new Stylesheet(flattenRules(this.rules));
}

Stylesheet.prototype.extend = function() {
  return new Stylesheet(extendRules(this.rules));
}

Stylesheet.prototype.toString = function() {
  var stylesheet = this.flatten().extend().removePlaceholders();
  console.log(stylesheet.rules);
  return stringify({type: 'stylesheet', stylesheet: stylesheet});
}

Stylesheet.prototype.concat = function(stylesheet) {
  var rules = stylesheet.rules || stylesheet;
  return new Stylesheet(this.rules.concat(rules));
}

function Rule(selectors, declarations) {
  this.type = 'rule';
  this.selectors = selectors;
  this.declarations = declarations;
}

Rule.prototype.addSelector = function(selector) {
  var selectors = this.selectors.concat(selector);
  return new Rule(selectors, this.declarations);
}

function Import(stylesheet) {
  this.type = 'import';
  this.stylesheet = stylesheet;
}

function Extend(selector) {
  this.type = 'extend';
  this.selector = selector;
}

/**
 * Flatten stylesheet hierarchy
 */
function flattenRules(rules, seen) {
  seen = seen || [];
  return flatMap(rules, function(rule) {
    if (rule.type === 'import') {
      if (seen.indexOf(rule.stylesheet) > -1) return [];
      seen.push(rule.stylesheet);
      return flattenRules(rule.stylesheet.rules, seen);
    }
    return rule;
  });
}

/**
 * Extend stylesheet rules
 */
function extendRules(rules) {
  rules = rules.slice(0);

  var index = {};
  var changeset = {};

  function removeExtends(rule) {
    return new Rule(
      rule.selectors,
      rule.declarations.filter(function(d) { return d.type !== 'extend'; }));
  }

  rules.forEach(function(rule, idx) {
    if (rule.type === 'rule') {
      var seenExtend = false;

      // add rule to index
      // TODO: handle complex selectors, like .a > .b and so
      rule.selectors.forEach(function(selector) {
        index[selector] = index[selector] || [];
        index[selector].push({rule: rule, idx: idx});
      });

      // process extends
      rule.declarations.forEach(function(decl) {
        if (decl.type === 'extend') {
          seenExtend = true;
          var extendables = index[decl.selector];
          if (!extendables) {
            throw new Error("cannot extend " + decl.selector);
          }
          extendables.forEach(function(extendable) {
            var extendedRule = changeset[extendable.idx] || extendable.rule;

            // add extendable rule to the index for the extended rule selectors
            // so we enable chaining
            // TODO: handle complex selectors, like .a > .b and so
            rule.selectors.forEach(function(selector) {
              index[selector] = index[selector] || [];
              index[selector].push(extendable);
            });

            changeset[extendable.idx] = extendedRule.addSelector(rule.selectors);
          });
        }
      });

      if (seenExtend) {
        changeset[idx] = removeExtends(changeset[idx] || rule);
      }
    }
  });

  for (var idx in changeset) {
    rules[idx] = changeset[idx];
  }

  return rules;
}

function removePlaceholderRules(rules) {
  rules = rules.slice(0);

  function removePlaceholderSelectors(rule) {
    var selectors = rule.selectors.filter(function(selector) {
      return !/%[a-zA-Z]/.exec(selector);
    });
    return new Rule(selectors, rule.declarations);
  }

  return rules
    .map(removePlaceholderSelectors)
    .filter(function(rule) {
      return rule.selectors.length > 0 && rule.declarations.length > 0;
    });
}

function toArray(o) {
  return Array.prototype.slice.call(o);
}

function isString(o) {
  return Object.prototype.toString.call(o) === '[object String]';
}

function stylesheet() {
  return new Stylesheet(toArray(arguments));
}

function rule() {
  var selectors = [];
  var declarations = [];

  toArray(arguments).forEach(function(arg) {
    if (isString(arg)) {
      if (declarations.length > 0) {
        throw new Error('selector values goes after declaration');
      }
      selectors.push(arg);
    } else {
      if (!arg.type) {
        for (var k in arg) {
          declarations.push({type: 'declaration', property: k, value: arg[k]});
        }
      } else {
        declarations.push(arg);
      }
    }
  });

  return new Rule(selectors, declarations);
}

function imp(stylesheet) {
  return new Import(stylesheet);
}

function extend(selector) {
  return new Extend(selector);
}

function mod(func) {
  return func;
}

module.exports = {
  Extend: Extend,
  Import: Import,
  Rule: Rule,
  Stylesheet: Stylesheet,
  extend: extend,
  import: imp,
  rule: rule,
  stylesheet: stylesheet,
  module: mod,
};

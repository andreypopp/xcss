"use strict";
/**
 * XCSS object model
 */

var stringify = require('css-stringify');
var flatMap   = require('flatmap');

function Stylesheet(rules) {
  this.type = 'stylesheet';
  this.rules = rules;
}

Stylesheet.prototype.flatten = function() {
  return new Stylesheet(flattenRules(this.rules));
}

Stylesheet.prototype.toString = function() {
  return stringify({type: 'stylesheet', stylesheet: this.flatten()});
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

function Import(stylesheet) {
  this.type = 'import';
  this.stylesheet = stylesheet;
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
      for (var k in arg) {
        declarations.push({type: 'declaration', property: k, value: arg[k]});
      }
    }
  });

  return new Rule(selectors, declarations);
}

function imp(stylesheet) {
  return new Import(stylesheet);
}

module.exports = {
  Import: Import,
  Rule: Rule,
  Stylesheet: Stylesheet,
  import: imp,
  rule: rule,
  stylesheet: stylesheet
};

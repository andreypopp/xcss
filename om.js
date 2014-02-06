"use strict"
/**
 * XCSS object model
 */

var stringify = require('css-stringify');
var flatMap   = require('flatmap');

function Stylesheet() {
  if (!(this instanceof Stylesheet)) return construct(Stylesheet, arguments);
  this.type = 'stylesheet';
  this.rules = toArray(arguments);
}

Stylesheet.prototype.toString = function() {
  return stringify({type: 'stylesheet', stylesheet: {rules: flattenStylesheet(this)}});
}

Stylesheet.prototype.concat = function(stylesheet) {
  var rules = stylesheet.rules || stylesheet;
  return new Stylesheet(this.rules.concat(rules));
}

function Rule() {
  if (!(this instanceof Rule)) return construct(Rule, arguments);
  this.type = 'rule';
  this.selectors = [];
  this.declarations = [];

  toArray(arguments).forEach(function(arg) {
    if (isString(arg)) {
      if (this.declarations.length > 0) {
        throw new Error('selector values goes after declaration');
      }
      this.selectors.push(arg);
    } else {
      for (var k in arg) {
        this.declarations.push({type: 'declaration', property: k, value: arg[k]});
      }
    }
  }, this);
}

function Import(stylesheet) {
  if (!(this instanceof Import)) return construct(Import, arguments);
  this.type = 'import';
  this.stylesheet = stylesheet;
}

/**
 * Flatten stylesheet hierarchy
 */
function flattenStylesheet(stylesheet, seen) {
  seen = seen || [];
  return flatMap(stylesheet.rules, function(rule) {
    if (rule.type === 'import') {
      if (seen.indexOf(rule.stylesheet) > -1) return [];
      seen.push(rule.stylesheet);
      return flattenStylesheet(rule.stylesheet, seen);
    }
    return rule;
  });
}

function construct(cls, args) {
  Array.prototype.unshift.call(args, null);
  return new (Function.prototype.bind.apply(cls, args));
}

function toArray(o) {
  return Array.prototype.slice.call(o);
}

function isString(o) {
  return Object.prototype.toString.call(o) === '[object String]';
}

module.exports = {
  Import: Import,
  Rule: Rule,
  Stylesheet: Stylesheet
};

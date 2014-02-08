"use strict";
/**
 * XCSS object model
 */

var stringify = require('css-stringify');
var flatMap   = require('flatmap');

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

var linearize   = require('./transforms/linearize-imports');
var inheritance = require('./transforms/rule-inheritance');
var cleanup     = require('./transforms/cleanup');

function Stylesheet(rules) {
  this.type = 'stylesheet';
  this.rules = rules;

  if (process.env.NODE_ENV !== 'production') {
    var deepFreeze  = require('deep-freeze');
    deepFreeze(this);
  }
}

Stylesheet.prototype.transform = function(fn) {
  return fn(this);
}

Stylesheet.prototype.filter = function(fn) {
  return new Stylesheet(this.rules.filter(fn));
}

Stylesheet.prototype.map = function(fn) {
  return new Stylesheet(this.rules.map(fn));
}

Stylesheet.prototype.flatMap = function(fn) {
  return new Stylesheet(flatMap(this.rules, fn));
}

Stylesheet.prototype.toCSS = function() {
  var stylesheet = this
    .transform(linearize)
    .transform(inheritance)
    .transform(cleanup);
  return stringify({type: 'stylesheet', stylesheet: stylesheet});
}

Stylesheet.prototype.toString = Stylesheet.prototype.toCSS;

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

Rule.prototype.filter = function(fn) {
  return new Rule(this.selectors, this.declarations.filter(fn));
}

Rule.prototype.map = function(fn) {
  return new Rule(this.selectors, this.declarations.map(fn));
}

Rule.prototype.flatMap = function(fn) {
  return new Rule(this.selectors, flatMap(this.declarations, fn));
}

function Import(stylesheet) {
  this.type = 'import';
  this.stylesheet = stylesheet;
}

function Extend(selector) {
  this.type = 'extend';
  this.selector = selector;
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

function toArray(o) {
  return Array.prototype.slice.call(o);
}

function isString(o) {
  return Object.prototype.toString.call(o) === '[object String]';
}

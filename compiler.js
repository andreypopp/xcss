"use strict";
/**
 * XCSS compiler
 */

var BaseCompiler  = require('css-stringify/lib/compiler');
var recast        = require('recast');
var util          = require('util');
var toCamelCase   = require('to-camel-case');
var parse         = require('./parser');
var compileExpr   = require('./expression-compiler');

var b = recast.types.builders;

function Compiler(options) {
  options = options || {};
  BaseCompiler.call(this, options);
  this.visit = this.visit.bind(this);

  this.options.xcssModulePath = this.options.xcssModulePath || 'xcss';

  this.requires = [buildRequire('xcss', this.options.xcssModulePath)];
  this.scope = {};
}
util.inherits(Compiler, BaseCompiler);

Compiler.prototype.compile = function(node){
  var requires = b.variableDeclaration('var', this.requires);
  var stylesheet = this.stylesheet(node);
  return recast.print(requires).code +
    '\n\n' +
    'module.exports = ' +
    recast.print(stylesheet).code;
};

// add module into scope
Compiler.prototype.declareRequire = function(id, path) {
  this.requires.push(buildRequire(id, path));
  this.scope[id] = true;
};

// CSS stylesheet -> xcss.Stylesheet
Compiler.prototype.stylesheet = function(node){
  var rules = node.stylesheet.rules.filter(function(rule) {
    if (rule.type === 'require') {
      var imp = parseRequire(rule.require);
      if (imp) {
        this.declareRequire(imp.id, imp.path);
        return false;
      }
    }
    return true;
  }, this);

  return b.callExpression(
    b.identifier('xcss.stylesheet'),
    rules.map(this.visit));
};

// CSS rule -> xcss.Rule
Compiler.prototype.rule = function(node){
  var declarations = node.declarations.map(this.visit);

  // probably a call in rule position
  if (node.selectors.length === 1 && node.selectors[0].indexOf(' ') === -1) {
    var name = toCamelCase(node.selectors[0]);
    if (this.scope[getIdentifier(name)]) {
      return b.callExpression(
        b.identifier(name),
        declarations);
    }
  }

  var selectors = node.selectors.map(b.literal);
  return b.callExpression(
    b.identifier('xcss.rule'),
    selectors.concat(declarations));
};

// CSS declaration to {prop: val, ...} or call
Compiler.prototype.declaration = function(node) {
  var name = toCamelCase(node.property);
  var value = compileExpr(node.value);

  if (this.scope[getIdentifier(name)]) {
    return b.callExpression(
      b.identifier(name),
      [value]);
  } else {
    return b.objectExpression([
      b.property(
        'init',
        b.literal(name),
        value)]);
  }
};

// @import -> xcss.Import
Compiler.prototype.import = function(node) {
  var value = node.import.replace(/"/g, '');
  var reqCall = b.callExpression(
    b.identifier('require'),
    [b.literal(value)]);
  return b.callExpression(
    b.identifier('xcss.import'),
    [reqCall]);
};

function parseRequire(value) {
  var m = /^"([^"]+)" +as +([a-zA-Z_][a-zA-Z0-9_]*)$/.exec(value.trim());
  if (m) return {path: m[1], id: m[2]};
}

function getIdentifier(name) {
  var identifier = name;
  if (name.indexOf('.') > -1) {
    identifier = name.split('.')[0];
  }
  return identifier;
}

function buildRequire(id, path) {
  return b.variableDeclarator(
    b.identifier(id),
    b.callExpression(b.identifier('require'), [b.literal(path)]));
}

module.exports = function(src, options) {
  var stylesheet = parse(src);
  return new Compiler(options).compile(stylesheet);
}

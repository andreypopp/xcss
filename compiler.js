"use strict";
/**
 * XCSS compiler
 */

var BaseCompiler      = require('css-stringify/lib/compiler');
var recast            = require('recast');
var util              = require('util');
var toCamelCase       = require('to-camel-case');
var flatMap           = require('flatmap');
var parse             = require('./parser');
var compileExpression = require('./expression-compiler');

var b = recast.types.builders;

function Compiler(options) {
  options = options || {};
  BaseCompiler.call(this, options);
  this.visit = this.visit.bind(this);

  this.options.xcssModulePath = this.options.xcssModulePath || 'xcss';

  this.moduleParameters = null;
  this.variables = [];
  this.requires = [buildRequire('xcss', this.options.xcssModulePath)];
  this.scope = {};
}
util.inherits(Compiler, BaseCompiler);

Compiler.prototype.compile = function(node){
  var stylesheet = this.stylesheet(node);
  var requires = b.variableDeclaration('var', this.requires);
  var vars = b.variableDeclaration('var', [buildDeclaration('vars', b.objectExpression(this.variables))]);

  if (this.moduleParameters) {

    stylesheet = buildModule(
      this.moduleParameters,
      [vars, b.returnStatement(stylesheet)]);

    return recast.print(requires).code + '\n\n' +
      'module.exports = ' +
      recast.print(stylesheet).code;

  } else {

    return recast.print(requires).code + '\n' +
      recast.print(vars).code + '\n\n' +
      'module.exports = ' +
      recast.print(stylesheet).code;
  }
};

/**
 * Compile stylesheet.
 */
Compiler.prototype.stylesheet = function(node){
  var rules = node.stylesheet.rules.map(this.visit).filter(Boolean);

  return b.callExpression(
    b.identifier('xcss.stylesheet'),
    [b.identifier('vars')].concat(rules));
};

/**
 * Compile comment.
 */
Compiler.prototype.comment = function(node) {
  // TODO: emit comments as well
  return false;
};

/**
 * Compile @require.
 */
Compiler.prototype.require = function(node) {
  this.requires.push(buildRequire(node.id, node.path));
  this.scope[node.id] = true;
  return false;
};

/**
 * Compile @module.
 */
Compiler.prototype.module = function(node){
  this.moduleParameters = node.module
    .split(',')
    .map(function(a) { return b.identifier(a.trim()) });

  return false;
}

/**
 * Compile CSS rule.
 */
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

/**
 * Compile @vars.
 */
Compiler.prototype.vars = function(node) {
  var declarations = node.declarations.map(this.visit);

  this.variables = this.variables.concat(flatMap(declarations, function(expr) {
    return expr.properties;
  }));

  return false;
};

/**
 * Compile CSS declaration.
 */
Compiler.prototype.declaration = function(node) {
  var name = toCamelCase(node.property);
  var value = compileExpression(node.value, this.scope);
  var identifier = getIdentifier(name);

  if (this.scope[identifier]) {
    return b.callExpression(
      b.identifier(name),
      [value]);
  } else if (identifier === 'extend') {
    return b.callExpression(
      b.identifier('xcss.extend'),
      [value]);
  } else {
    return b.objectExpression([
      b.property(
        'init',
        b.literal(node.property),
        value)]);
  }
};

/**
 * Compile @import
 */
Compiler.prototype.import = function(node) {
  var m = /^"([^"]+)"( +with +(.+))?/.exec(node.import);
  var value = m[1];
  var args = m[3];

  var ast = b.callExpression(
    b.identifier('require'),
    [b.literal(value)]);

  if (args) {
    args = '(' + args + ')';
    args = compileExpression.parseExpression(args);
    args = args.expressions ? args.expressions : [args];
    ast = b.callExpression(ast, args);
  }

  return b.callExpression(
    b.identifier('xcss.import'),
    [ast]);
};

function getIdentifier(name) {
  var identifier = name;
  if (name.indexOf('.') > -1) {
    identifier = name.split('.')[0];
  }
  return identifier;
}

function buildModule(params, stmts) {
  var factory = b.functionExpression(null, params, b.blockStatement(stmts));
  return b.callExpression(b.identifier('xcss.module'), [factory]);
}

function buildRequire(id, path) {
  var expr = b.callExpression(b.identifier('require'), [b.literal(path)]);
  return buildDeclaration(id, expr);
}

function buildDeclaration(id, expr) {
  return b.variableDeclarator(b.identifier(id), expr);
}

function buildVarProp(id, expr) {
  return b.property('init', b.literal(id), expr);
}

module.exports = function(src, options) {
  var stylesheet = parse(src);
  return new Compiler(options).compile(stylesheet);
}

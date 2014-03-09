"use strict";
/**
 * XCSS compiler
 */

var BaseCompiler      = require('css-stringify/lib/compiler');
var recast            = require('recast');
var util              = require('util');
var toCamelCase       = require('to-camel-case');
var parse             = require('./parser');
var utils             = require('./utils');
var compileExpression = require('./expression-compiler');

var b                    = recast.types.builders;
var literal              = b.literal;
var identifier           = b.identifier;
var memberExpression     = b.memberExpression;
var callExpression       = b.callExpression;
var functionExpression   = b.functionExpression;
var objectExpression     = b.objectExpression;
var property             = b.property;
var returnStatement      = b.returnStatement;
var variableDeclaration  = b.variableDeclaration;
var variableDeclarator   = b.variableDeclarator;
var blockStatement       = b.blockStatement;
var expressionStatement  = b.expressionStatement;
var assignmentExpression = b.assignmentExpression;

function Compiler(options) {
  options = options || {};
  BaseCompiler.call(this, options);
  this.visit = this.visit.bind(this);

  this.options.xcssModulePath = this.options.xcssModulePath || 'xcss';

  this.moduleParameters = null;
  this.localDeclarations = [makeDeclaration('vars', objectExpression([]))];
  this.globalDeclarations = [makeRequire('xcss', this.options.xcssModulePath)];
  this.scope = {};
  this.counter = 0;
}
util.inherits(Compiler, BaseCompiler);

Compiler.prototype.uniqueName = function(prefix) {
  return prefix + '$' + (this.counter++);
}

Compiler.prototype.compile = function(node){
  var stylesheet = this.stylesheet(node);

  if (this.moduleParameters) {

    stylesheet = makeModule(
      this.moduleParameters,
      this.localDeclarations.concat(returnStatement(stylesheet)));

    return utils.print(this.globalDeclarations) + '\n\n' +
      'module.exports = ' +
      utils.print(stylesheet);

  } else {

    return utils.print(this.globalDeclarations) + '\n' +
      utils.print(this.localDeclarations) + '\n\n' +
      'module.exports = ' +
      utils.print(stylesheet);
  }
};

/**
 * Compile stylesheet.
 */
Compiler.prototype.stylesheet = function(node){
  var rules = node.stylesheet.rules.map(this.visit).filter(Boolean);

  return callExpression(
    identifier('xcss.om.stylesheet'),
    [identifier('vars')].concat(rules));
};

/**
 * Compile @media
 */
Compiler.prototype.media = function(node){
  var rules = node.rules.map(this.visit).filter(Boolean);
  return callExpression(
    identifier('xcss.om.media'),
    [literal(node.media)].concat(rules));
};

/**
 * Compile @supports
 */
Compiler.prototype.supports = function(node){
  var rules = node.rules.map(this.visit).filter(Boolean);
  return callExpression(
    identifier('xcss.om.supports'),
    [literal(node.supports)].concat(rules));
};

/**
 * Compile @document
 */
Compiler.prototype.document = function(node){
  var rules = node.rules.map(this.visit).filter(Boolean);
  return callExpression(
    identifier('xcss.om.document'),
    [literal(node.document)].concat(rules));
};

/**
 * Compile @keyframes
 */
Compiler.prototype.keyframes = function(node){
  var keyframes = node.keyframes.map(this.visit).filter(Boolean);
  return callExpression(
    identifier('xcss.om.keyframes'),
    [literal(node.name)].concat(keyframes));
};

/**
 * Compile @host
 */
Compiler.prototype.host = function(node){
  return false;
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
  this.globalDeclarations.push(makeRequire(node.id, node.require));
  this.scope[node.id] = true;
  return false;
};

/**
 * Compile @module.
 */
Compiler.prototype.module = function(node){
  this.moduleParameters = node.module.split(',').map(function(a) { return a.trim() });
  return false;
}

/**
 * Compile CSS rule.
 */
Compiler.prototype.rule = function(node){
  var declarations = node.declarations;

  // probably a call in rule position
  if (node.selectors.length === 1 && node.selectors[0].indexOf(' ') === -1) {
    var name = toCamelCase(node.selectors[0]);
    if (this.scope[utils.getIdentifier(name)]) {
      return callExpression(
        identifier(name),
        declarations.map(this.visit));
    } else if (name === ':root') {
      declarations = declarations.filter(function(decl) {
        if (/^var\-/.exec(decl.property)) {
          this.localDeclarations.push(makeVar(
            decl.property.slice(4),
            compileExpression(decl.value, this.scope)));
          return false;
        }
        return true;
      }, this);
    }
  } 

  var selectors = node.selectors.map(literal).filter(Boolean);
  return callExpression(
    identifier('xcss.om.rule'),
    selectors.concat(declarations.map(this.visit).filter(Boolean)));
};

/**
 * Compile CSS keyframe.
 */
Compiler.prototype.keyframe = function(node){
  var declarations = node.declarations;
  var values = node.values.map(literal).filter(Boolean);
  return callExpression(
    identifier('xcss.om.keyframe'),
    values.concat(declarations.map(this.visit).filter(Boolean)));
};

/**
 * Compile @page
 */
Compiler.prototype.page = function(node){
  var declarations = node.declarations;
  var selectors = node.selectors.map(literal).filter(Boolean);
  return callExpression(
    identifier('xcss.om.page'),
    selectors.concat(declarations.map(this.visit).filter(Boolean)));
};

/**
 * Compile CSS declaration.
 */
Compiler.prototype.declaration = function(node) {
  var name = toCamelCase(node.property);
  var value = compileExpression(node.value, this.scope);

  if (this.scope[utils.getIdentifier(name)]) {
    return callExpression(
      identifier(name),
      [value]);
  } else if (name === 'extend') {
    return callExpression(
      identifier('xcss.om.extend'),
      [value]);
  } else {
    return objectExpression([
      property(
        'init',
        literal(node.property),
        value)]);
  }
};

/**
 * Compile @import
 */
Compiler.prototype.import = function(node) {
  if (node.require) {
    var ast = callExpression(
      identifier('require'),
      [literal(node.require)]);

    if (node.args) {
      var args = utils.parseExpression('(' + node.args + ')');
      args = args.expressions ? args.expressions : [args];
      ast = callExpression(ast, args);
    }

    var name = this.uniqueName('import');

    this.localDeclarations.push(makeDeclaration(name, ast));
    this.localDeclarations.push(makeVarMerge([name]));

    return callExpression(
      identifier('xcss.om.import'),
      [identifier(name)]);
  } else if (node.import) {

    return callExpression(
      identifier('xcss.om.importReference'),
      [literal(node.import)]);
  }
};

Compiler.prototype.charset = function(node) {
  return callExpression(
    identifier('xcss.om.charset'),
    [literal(node.charset)]);
}

Compiler.prototype.namespace = function(node) {
  return callExpression(
    identifier('xcss.om.namespace'),
    [literal(node.namespace)]);
}

// xcss.om.module(function($params ...) { $stmts ... })
function makeModule(params, stmts) {
  stmts.splice(1, 0, makeVarMerge(params));
  params = params.map(identifier);
  var factory = functionExpression(null, params, blockStatement(stmts));
  return callExpression(identifier('xcss.om.module'), [factory]);
}

// var $id = require($path)
function makeRequire(id, path) {
  var expr = callExpression(identifier('require'), [literal(path)]);
  return makeDeclaration(id, expr);
}

// vars.$id = $value
function makeVar(id, expr) {
  return assignmentExpression('=',
    memberExpression(identifier('vars'), literal(id), true),
    expr);
}

// xcss.runtime.merge(vars, $name.vars)
function makeVarMerge(names) {
  names = names.map(function(name) {
    return memberExpression(identifier(name), identifier('vars'), false);
  });
  var expr = callExpression(
    identifier('xcss.runtime.merge'),
    [identifier('vars')].concat(names));
  return expressionStatement(expr);
}

// var $id = $value
function makeDeclaration(id, expr) {
  return variableDeclaration('var', [variableDeclarator(identifier(id), expr)]);
}

module.exports = function(src, options) {
  var stylesheet = parse(src);
  return new Compiler(options).compile(stylesheet);
}

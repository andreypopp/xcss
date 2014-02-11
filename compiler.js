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
  this.localDeclarations = [makeDeclaration('vars', b.objectExpression([]))];
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
      this.localDeclarations.concat(b.returnStatement(stylesheet)));

    return print(this.globalDeclarations) + '\n\n' +
      'module.exports = ' +
      print(stylesheet);

  } else {

    return print(this.globalDeclarations) + '\n' +
      print(this.localDeclarations) + '\n\n' +
      'module.exports = ' +
      print(stylesheet);
  }
};

/**
 * Compile stylesheet.
 */
Compiler.prototype.stylesheet = function(node){
  var rules = node.stylesheet.rules.map(this.visit).filter(Boolean);

  return b.callExpression(
    b.identifier('xcss.om.stylesheet'),
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
  this.globalDeclarations.push(makeRequire(node.id, node.path));
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
  var declarations = node.declarations;

  // probably a call in rule position
  if (node.selectors.length === 1 && node.selectors[0].indexOf(' ') === -1) {
    var name = toCamelCase(node.selectors[0]);
    if (this.scope[getIdentifier(name)]) {
      return b.callExpression(
        b.identifier(name),
        declarations.map(this.visit));
    } else if (name === ':root') {

      declarations = declarations.filter(function(decl) {
        if (/^var\-/.exec(decl.property)) {
          this.localDeclarations.push(makeVar(toCamelCase(decl.property.slice(4)), decl.value));
          return false;
        }
        return true;
      }, this);
    }
  } 

  var selectors = node.selectors.map(b.literal);
  return b.callExpression(
    b.identifier('xcss.om.rule'),
    selectors.concat(declarations.map(this.visit)));
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
      b.identifier('xcss.om.extend'),
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

  var name = this.uniqueName('import');

  this.localDeclarations.push(makeDeclaration(name, ast));
  this.localDeclarations.push(b.callExpression(
        b.identifier('xcss.runtime.merge'),
        [b.identifier('vars'), b.memberExpression(b.identifier(name), b.identifier('vars'), false)]));

  return b.callExpression(
    b.identifier('xcss.om.import'),
    [b.identifier(name)]);
};

function getIdentifier(name) {
  var identifier = name;
  if (name.indexOf('.') > -1) {
    identifier = name.split('.')[0];
  }
  return identifier;
}

function print(nodes) {
  if (Array.isArray(nodes)) {
    return nodes.map(function(node) { return recast.print(node).code }).join('\n');
  } else {
    return recast.print(nodes).code;
  }
}

function makeModule(params, stmts) {
  var factory = b.functionExpression(null, params, b.blockStatement(stmts));
  return b.callExpression(b.identifier('xcss.om.module'), [factory]);
}

function makeRequire(id, path) {
  var expr = b.callExpression(b.identifier('require'), [b.literal(path)]);
  return makeDeclaration(id, expr);
      
}

function makeVar(id, value) {
  return b.assignmentExpression('=',
    b.memberExpression(b.identifier('vars'), b.identifier(id), false),
    b.literal(value));
}

function makeDeclaration(id, expr) {
  return b.variableDeclaration('var', [b.variableDeclarator(b.identifier(id), expr)]);
}

module.exports = function(src, options) {
  var stylesheet = parse(src);
  return new Compiler(options).compile(stylesheet);
}

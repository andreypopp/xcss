"use strict";
/**
 * XCSS expression compiler
 */

var recast      = require('recast');
var flatMap     = require('flatmap');
var utils       = require('./utils');

var b                 = recast.types.builders;
var literal           = b.literal;
var identifier        = b.identifier;
var binaryExpression  = b.binaryExpression;
var logicalExpression = b.logicalExpression;
var memberExpression  = b.memberExpression;
var callExpression    = b.callExpression;

/**
 * Compile xCSS expression.
 *
 * @param {String} str
 * @param {Object} scope
 */
function compile(str, scope) {
  if (!/[\(\){}]/.exec(str)) return literal(str);

  var nodes = compile2(compile1(str), scope || {});

  if (nodes.length === 0) return literal('');
  return foldLiterals(nodes)
    .reduce(function(c, e) {return binaryExpression('+', c, e)});
}

/**
 * Fold adjacent string literals
 */
function foldLiterals(nodes) {
  return nodes.reduce(function(c, e) {
    if (e.type === 'Literal') {
      var last = c[c.length - 1];
      if (last && last.type === 'Literal') {
        c.pop();
        return c.concat(literal(last.value + e.value));
      }
    }
    return c.concat(e);
  }, [])
}

/**
 * Compile JS interpolations.
 *
 * @param {String} str
 */
function compile1(str) {
  if (!/[{}]/.exec(str)) return [literal(str)];

  var depth = 0;
  var nodes = [];
  var m;
  var buffer = '';

  while ((m = /[{}]/.exec(str)) && str.length > 0) {
    var chunk = str.substring(0, m.index);
    switch (m[0]) {
      case '{':
        depth += 1;
        if (depth === 1) {
          buffer += chunk;
          if (buffer.length > 0) nodes.push(literal(buffer));
          buffer = '';
        } else {
          buffer += chunk + '{';
        }
        break;
      case '}':
        depth -= 1;
        if (depth === 0) {
          buffer += chunk;
          if (buffer.length > 0) nodes.push(utils.parseExpression(buffer));
          buffer = '';
        } else {
          buffer += chunk + '}';
        }
        break;
    }
    str = str.substring(m.index + 1);
  }

  if (str.length > 0)
    nodes.push(literal(str));

  return nodes;
}

/**
 * Compile function calls and variable references
 *
 * @param {Array<Node>} nodes
 * @param {Object} scope
 */
function compile2(nodes, scope) {
  var toks = flatMap(nodes, function(expr) {
    return expr.type === 'Literal' ? tokenize2(expr.value) : expr;
  });
  return parse2(toks, scope);
}

function tokenize2(str) {
  if (!/[\(\),]/.exec(str)) return [str];

  var m;
  var toks = [];

  while ((m = /[\(\), ]/.exec(str)) && str.length > 0) {
    if (m.index > 0) toks.push(str.substring(0, m.index));
    toks.push(m[0]);
    str = str.substring(m.index + m[0].length);
  }

  if (str.length > 0) toks.push(str);

  return toks;
}

function parse2(toks, scope, incall) {
  var state = null;
  var nodes = [];

  while (toks.length > 0) {
    var tok = toks.shift();
    var isstring = typeof tok === 'string';
    switch (tok) {
      case '(':
        var args;
        if (state === 'id') {
          state = undefined;
          args = normalizeArgs(parse2(toks, scope, true));
          nodes.push(callExpression(identifier(nodes.pop().value), args));
        } else if (state === 'var') {
          state = undefined;
          nodes.pop();
          args = normalizeArgs(parse2(toks, scope, true));
          var node = makeVarAccessor(args[0], args[1]);
          nodes.push(node);
        } else {
          nodes.push(literal(tok));
        }
        break;
      case ',':
        if (!incall) {
          nodes.push(literal(tok));
        } else {
          nodes.push(undefined);
        }
        break;
      case ')':
        state = undefined;
        if (!incall) nodes.push(literal(tok));
        if (incall) return nodes;
        break;
      default:
        if (typeof tok === 'object') {
          nodes.push(tok)
        } else {
          if (tok === 'var') {
            state = 'var';
            nodes.push(literal(tok));
          } else if (scope[utils.getIdentifier(tok)]) {
            state = 'id';
            nodes.push(literal(tok));
          } else if (!isstring || isstring && tok.length > 0) {
            var last = nodes[nodes.length - 1];
            if (last && last.type === 'Literal') {
              last.value += tok;
            } else {
              nodes.push(literal(tok));
            }
          }
        }
        break;
    }
  }

  if (incall) throw new Error('missing )');

  return nodes;
}

function makeVarAccessor(name, fallback) {
  if (!name) {
    throw new Error('unknown var(...) reference');
  }
  var node = memberExpression(identifier('vars'), name, true)
  if (fallback) {
    node = logicalExpression('||', node, fallback);
  }
  return node;
}

function normalizeArgs(nodes) {
  return nodes.map(utils.trim).filter(function(node) {
    return node && (node.type === 'Literal' && node.value.length > 0 || node.type !== 'Literal');
  });
}

module.exports = compile;

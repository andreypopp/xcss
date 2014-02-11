"use strict";
/**
 * XCSS expression compiler
 */

var recast      = require('recast');
var flatMap     = require('flatmap');
var utils       = require('./utils');
var b           = recast.types.builders;

function compile(str, scope) {
  if (!/[\(\){}]/.exec(str)) return b.literal(str);

  var nodes = compile2(compile1(str), scope || {});

  if (nodes.length === 0) return b.literal('');

  return nodes.reduce(function(c, e) {
    return b.binaryExpression('+', c, e);
  });
}

function compile1(str) {
  if (!/[{}]/.exec(str)) return [b.literal(str)];

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
          if (buffer.length > 0) nodes.push(b.literal(buffer));
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
    nodes.push(b.literal(str));

  return nodes;
}

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

  while ((m = /[\(\),]/.exec(str)) && str.length > 0) {
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
        if (state === 'id') {
          var args = parse2(toks, scope, true);
          nodes.push(b.callExpression(b.identifier(nodes.pop().value), args));
        } else if (state === 'var') {
          nodes.pop();
          var args = parse2(toks, scope, true);
          if (!args[0]) {
            throw new Error('unknown var(...) reference');
          }
          var node = b.memberExpression(b.identifier('vars'), args[0], true)
          if (args[1]) {
            node = b.logicalExpression('||', node, args[1]);
          }
          nodes.push(node);
        } else {
          nodes.push(b.literal(tok));
        }
        break;
      case ',':
        if (!incall) nodes.push(b.literal(tok));
        break;
      case ')':
        state = undefined;
        if (!incall) nodes.push(b.literal(tok));
        if (incall) return nodes;
        break;
      default:
        if (typeof tok === 'object') {
          nodes.push(tok)
        } else {
          tok = incall ? utils.trim(tok) : tok;
          if (tok === 'var') {
            state = 'var';
          } else if (scope[utils.getIdentifier(tok)]) {
            state = 'id';
          }
          if (!isstring || isstring && tok.length > 0) nodes.push(b.literal(tok));
        }
        break;
    }
  }

  if (incall) throw new Error('missing )');

  return nodes;
}

module.exports = compile;

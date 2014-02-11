"use strict";

var recast  = require('recast');

function trim(tok) {
  if (tok && tok.type === 'Literal' && tok.value.trim)
    tok.value = tok.value.trim();
  return tok;
}

function parseExpression(src) {
  return recast.parse(src).program.body[0].expression;
}

function getIdentifier(name) {
  if (typeof name !== 'string') return name;
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

module.exports = {
  trim: trim,
  parseExpression: parseExpression,
  print: print,
  getIdentifier: getIdentifier
};

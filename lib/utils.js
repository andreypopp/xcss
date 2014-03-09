"use strict";

var recast  = require('recast');
var escodegen = require('escodegen');

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

function generate(node) {
  return escodegen.generate(node);
}

function print(nodes) {
  if (Array.isArray(nodes)) {
    return nodes
      .map(function(node) {return generate(node) })
      .join('\n');
  } else {
    return generate(nodes);
  }
}

module.exports = {
  trim: trim,
  parseExpression: parseExpression,
  print: print,
  getIdentifier: getIdentifier
};

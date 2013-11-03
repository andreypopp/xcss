"use strict";
/**
 * XCSS expression compiler
 */

var recast  = require('recast');
var b       = recast.types.builders;

function compile(value) {
  var depth = 0;
  var expressions = [];
  var buffer = '';

  for (var i = 0, len = value.length; i < len; i++) {
    var c = value[i];
    if (c === '{') {
      depth += 1;
      if (depth === 1) {
        if (buffer.length > 0)
          expressions.push(b.literal(buffer));
        buffer = '';
      } else {
        buffer += c;
      }
    } else if (c === '}') {
      depth -= 1;
      if (depth === 0) {
        if (buffer.length > 0)
          expressions.push(parseExpr(buffer));
        buffer = '';
      } else {
        buffer += c;
      }
    } else {
      buffer += c;
    }
  }

  if (depth > 0) {
    throw new Error('missing }');
  }

  if (buffer.length > 0)
    expressions.push(b.literal(buffer));

  expressions = expressions.filter(function(e) {
    return !(e.type === 'Literal' && e.value === '');
  });

  if (expressions.length === 0)
    return b.literal('');

  return expressions.reduce(function(c, e) {
    return b.binaryExpression('+', c, e);
  });
}

function parseExpr(src) {
  return recast.parse(src).program.body[0].expression;
}

module.exports = compile;

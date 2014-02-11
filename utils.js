var recast  = require('recast');

function trim(tok) {
  return tok.trim ? tok.trim() : tok;
}

function parseExpression(src) {
  return recast.parse(src).program.body[0].expression;
}

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

module.exports = {
  trim: trim,
  parseExpression: parseExpression,
  print: print,
  getIdentifier: getIdentifier
};

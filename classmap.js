"use strict";

var detective = require('detective');

function find(source) {
  var nodes = detective.find(source, {
    word: 'cx',
    nodes: true,
    isRequire: function(node) {
      var c = node.callee;
      return (c &&
          node.type === 'CallExpression' &&
          c.type === 'Identifier' &&
          c.name === 'cx'
      );
    }
  }).nodes;

  var result = {map: {}, errors: []};

  nodes.forEach(function(node) {
    if (node.arguments.length === 1) {
      if (node.arguments[0].type !== 'ObjectExpression') {
        result.errors.push(node)
        return;
      }
      node.arguments[0].properties.forEach(function(p) {
        result.map[p.key.value || p.key.name] = true;
      });
    } else {
      node.arguments.forEach(function(n) {
        if (n.type !== 'Literal') {
          result.errors.push(node)
          return;
        }
        result.map[n.value] = true;
      });
    }
  });

  return result;
}

function nextName(chars) {
  var idx = chars.length - 1;
  var lst = chars[idx];
  if (lst === 57) chars[idx] = 65
  else if (lst === 90) chars[idx] = 97;
  else if (lst === 122) chars.push(48)
  else chars[idx] = chars[idx] + 1;
}

function fromCharCode(code) {
  return String.fromCharCode(code);
}

function compress(map) {
  var name = [65];
  var compressed = {};
  for (var k in map) {
    compressed[k] = '.' + name.map(fromCharCode).join('');
    nextName(name);
  }
  return compressed;
}

module.exports = {find: find, compress: compress};

"use strict";

try {
  var extend = require('rework-inherit');
} catch(err) {
  console.warn('install rework-inherit: npm install rework-inherit');
  throw err;
}

module.exports = function(style, ctx) {
  extend()(style);
  return style;
}

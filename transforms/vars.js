"use strict";

try {
  var vars = require('rework-vars');
} catch(err) {
  console.warn('install rework-vars: npm install rework-vars');
  throw err;
}

module.exports = function(style, ctx) {
  return vars(ctx.vars)(style.stylesheet);
}

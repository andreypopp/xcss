"use strict";

try {
  var autoprefixer = require('autoprefixer');
} catch(err) {
  console.warn('install autoprefixer: npm install autoprefixer');
  throw err;
}

module.exports = function(style, ctx) {
  return autoprefixer(ctx.autoprefixer).rework(style.stylesheet);
}

"use strict";

try {
  var shade = require('rework-shade');
} catch(err) {
  console.warn('install rework-shade: npm install rework-shade');
  throw err;
}

module.exports = function(style, ctx) {
  return shade()(style.stylesheet);
}

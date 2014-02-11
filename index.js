"use strict";
/**
 * XCSS Node entry
 */

var fs          = require('fs');
var compile     = require('./compiler');

require.extensions['.xcss'] = require.extensions['.css'] = function(module, filename) {
  var src = fs.readFileSync(filename, 'utf8');
  var options = {xcssModulePath: __filename};
  var compiled = compile(src, options);
  module._compile(compiled, filename);
};

module.exports = compile;
module.exports.om = require('xcss-object-model');
module.exports.runtime = require('./runtime');

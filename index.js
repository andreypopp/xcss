"use strict";
/**
 * XCSS Node entry
 */

var fs        = require('fs');
var compile   = require('./compiler');

require.extensions['.xcss'] = function(module, filename) {
  var src = fs.readFileSync(filename, 'utf8');
  var options = {
    xcssModulePath: process.env.XCSS_MODULE_PATH
  };
  var compiled = compile(src, options);
  module._compile(compiled, filename);
};

module.exports = require('./om');

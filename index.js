"use strict";

var fs        = require('fs');
var compile   = require('./compiler');

require.extensions['.xcss'] = function(module, filename) {
  var src = fs.readFileSync(filename, 'utf8');
  module._compile(compile(src), filename);
};

module.exports = require('./om');

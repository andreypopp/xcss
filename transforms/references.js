"use strict";

var visit = require('rework-visit');

module.exports = function(mod) {
  visit(mod.style.stylesheet, function(declarations) {
    var map = {};

    function replace(_, name) {
      // TODO: fix this problem for real with visionmedia/css-value
      if ('2x' === name) return '@' + name;
      if (null === map[name]) throw new Error('@' + name + ' is not defined in this scope');
      return map[name];
    }

    for (var i = 0, len = declarations.length; i < len; ++i) {
      var decl = declarations[i];
      var key = decl.property;
      var val = decl.value;

      if ('comment' == decl.type) continue;

      decl.value = val.replace(/@([-\w]+)/g, replace);

      map[key] = decl.value;
    }
  });
}

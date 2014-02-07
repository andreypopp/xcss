"use strict";
/**
 * Linearize stylesheet hieratchy by inlining imports.
 */

var flatMap = require('flatmap');

module.exports = function linearize(stylesheet, seen) {
  seen = seen || [];
  return stylesheet.flatMap(function(rule) {
    if (rule.type === 'import') {
      if (seen.indexOf(rule.stylesheet) > -1) return [];
      seen.push(rule.stylesheet);
      return linearize(rule.stylesheet, seen).rules;
    }
    return rule;
  });
}

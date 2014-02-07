"use strict";
/**
 * Cleanup transform.
 *
 * Remove placeholders and empty rules
 */

var om = require('../object-model');

module.exports = function(stylesheet) {
  return stylesheet
    .map(removePlaceholderSelectors)
    .filter(function(rule) {
      return rule.selectors.length > 0 && rule.declarations.length > 0;
    });
}

function removePlaceholderSelectors(rule) {
  var selectors = rule.selectors.filter(function(selector) {
    return !/%[a-zA-Z]/.exec(selector);
  });
  return new om.Rule(selectors, rule.declarations);
}

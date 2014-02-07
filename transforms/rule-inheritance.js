"use strict";
/**
 * Rule inheritance transform.
 */

var om = require('../object-model');

module.exports = function(stylesheet) {
  var index = {};
  var changeset = {};

  function storeIndex(k, v) {
    (index[k] || (index[k] = [])).push(v);
  }

  stylesheet.rules.forEach(function(rule, idx) {
    if (rule.type === 'rule') {
      var seenExtend = false;

      // add rule to index
      // TODO: handle complex selectors, like .a > .b and so
      rule.selectors.forEach(function(selector) {
        storeIndex(selector, {rule: rule, idx: idx});
      });

      // process extends
      rule.declarations.forEach(function(decl) {
        if (decl.type === 'extend') {
          seenExtend = true;
          var extendables = index[decl.selector];
          if (!extendables) {
            throw new Error("cannot extend " + decl.selector);
          }
          extendables.forEach(function(extendable) {
            var extendedRule = changeset[extendable.idx] || extendable.rule;

            // add extendable rule to the index for the extended rule selectors
            // so we enable chaining
            // TODO: handle complex selectors, like .a > .b and so
            rule.selectors.forEach(function(selector) {
              storeIndex(selector, extendable);
            });

            changeset[extendable.idx] = extendedRule.addSelector(rule.selectors);
          });
        }
      });

      if (seenExtend) {
        changeset[idx] = (changeset[idx] || rule).filter(function(d) {return d.type !== 'extend'});
      }
    }
  });

  return stylesheet.map(function(rule, idx) {
    return changeset[idx] || rule;
  });
}

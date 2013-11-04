"use strict";

var toString = Object.prototype.toString;

function isString(obj) {
  return toString.call(obj) === '[object String]'
}

function classNames(s) {
  return s.match(/\.[a-zA-Z0-9_\-]+/g).map(function(n) { return n.slice(1); });
}

function compress(s, map) {
  return s.replace(/\.[a-zA-Z0-9_\-]+/g, function(m, c) {
    var name = m.slice(1);
    return '.' + (map[name] && isString(map[name]) ? map[name] : name);
  });
}

module.exports = function(map) {
  function visit(node) {
    node.rules.forEach(function(rule, rIdx) {
      if (rule.rules) {
        visit(rule)
      } else if (rule.selectors) {
        rule.selectors.slice(0).forEach(function(s, sIdx) {
          var names = classNames(s);
          if (!names.some(function(n) { return map[n]; }))
            rule.selectors.splice(sIdx, 1);
        });

        rule.selectors = rule.selectors.map(function(s) {
          return compress(s, map);
        });

        if (rule.selectors.length === 0) {
          node.rules.splice(rIdx);
        }
      }
    });
  }
  return function(mod, ctx) {
    visit(mod.style.stylesheet);
  }
}

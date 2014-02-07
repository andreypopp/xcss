var xcss = require('../../index');

function rule(decl) {
  return xcss.rule('body', {width: '12px'}, decl);
}

module.exports = rule;
module.exports.rule = rule;

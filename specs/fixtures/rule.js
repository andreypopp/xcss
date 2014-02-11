var xcss = require('../../index');

function rule(decl) {
  return xcss.om.rule('body', {width: '12px'}, decl);
}

module.exports = rule;
module.exports.rule = rule;

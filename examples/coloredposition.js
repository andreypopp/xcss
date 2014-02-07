var xcss = require('../index');

function coloredPosition(color) {
  return {position: 'absolute', color: color};
}

function ColoredPosition(decl) {
  return xcss.rule('body', decl, coloredPosition('red'));
}

module.exports = {
  // this is meant to be called in a declaration position
  coloredPosition: coloredPosition,

  // this is meant to be called in a rule position
  ColoredPosition: ColoredPosition
}

module.exports = {
  // this is meant to be called in a declaration position
  coloredPosition: function(color) {
    return {position: 'absolute', color: color};
  },

  // this is meant to be called in a rule position
  ColoredPosition: function() {
  }
}

"use strict";

function merge(dst) {
  var args = Array.prototype.slice.call(arguments, 1);
  for (var i = 0, len = args.length; i < len; i++) {
    var src = args[i];
    for (var k in src)
      dst[k] = src[k];
  }
}

module.exports = {
  merge: merge
};

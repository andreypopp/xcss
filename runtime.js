"use strict";

function merge(a, b) {
  for (var k in b) a[k] = b[k];
}

module.exports = {
  merge: merge
};

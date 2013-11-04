"use strict";

var through     = require('through');
var combine     = require('stream-combiner');
var dgraph      = require('dgraph');
var imports     = require('dgraph-css-import');
var pack        = require('css-pack');
var sort        = require('deps-topo-sort');

/**
 * Resolve dependencies of a given CSS file and run a set of transforms over.
 *
 * @param {String} entry A path to entry CSS file
 * @param {Object} opts
 */
function xcss(entry, opts) {
  opts = opts || {};
  var dgraphOptions = {transform: imports};
  return combine(dgraph(entry, dgraphOptions), bundle(opts));
}

/**
 * Bundle stream of modules.
 *
 * @param {Object} opts
 */
function bundle(opts) {
  opts = opts || {};
  var transforms = [].concat(opts.transform)
    .filter(Boolean)
    .map(function(t) {
      return (typeof t === 'function') ? t : require(t);
    });
  var packer = pack({sorted: true, debug: opts.debug});
  if (transforms.length > 0) {
    // we aggregate modules before piping to packer because transforms may have
    // effect modules which are previously seen, e.g. we can extend a selector
    return combine(sort(), transform(transforms), aggregate(), packer);
  } else {
    return combine(sort(), packer);
  }
}

/**
 * Aggregate a stream of modules
 *
 * @private
 */
function aggregate() {
  var modules = [];
  return through(
    function(mod) { modules.push(mod); },
    function() {
      for (var i = 0, len = modules.length; i < len; i++)
        this.queue(modules[i]);
      this.queue(null);
    });
}

/**
 * Run a pipeline of transform over stream of modules.
 *
 * @private
 * @param {Array<Function>} transforms
 */
function transform(transforms) {
  var ctx = {};
  return through(function(mod) {
    try {
      for (var i = 0, len = transforms.length; i < len; i++) {
        var newMod = transforms[i](mod, ctx);
        if (newMod !== undefined) mod = newMod;
      }
    } catch(err) {
      this.emit('error', 'while transforming ' + mod.id + ': ' + err);
    }
    this.queue(mod);
  });
}

module.exports = xcss;
module.exports.bundle = bundle;

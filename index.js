"use strict";

var combine     = require('stream-combiner');
var kew         = require('kew');
var dgraph      = require('dgraph');
var imports     = require('dgraph-css-import');
var csspack     = require('css-pack');
var sort        = require('deps-topo-sort');
var resolve     = require('resolve');

/**
 * Resolve dependencies of a given CSS file and run a set of transforms over.
 *
 * @param {String} entry A path to entry CSS file
 * @param {Object} opts
 */
function xcss(entry, opts) {
  opts = opts || {};
  opts.basedir = opts.basedir || process.cwd();
  opts.transform = getTransforms(opts);
  var dgraphOptions = {globalTransform: imports};
  return combine(dgraph(entry, dgraphOptions), bundle(opts));
}

/**
 * Bundle stream of modules.
 *
 * @param {Object} opts
 */
function bundle(opts) {
  opts = opts || {};

  var sorter = sort();
  var combiner = csspack.combine(function(err, style, modules) {
    if (err)
      return combiner.emit('error', err);


    style = (opts.transform && opts.transform.length > 0) ?
      applyTransforms(style, opts.transform, opts) :
      kew.resolve(style);

    style.then(function(style) {
      var bundle = csspack.compile(style, {
        compress: opts.compress,
        debug: opts.debug,
        modules: modules
      });

      combiner.queue(bundle);
      combiner.queue(null);
    }, function(err) { combiner.emit('error', err) });
  });

  return combine(sorter, combiner);
}

function getTransforms(opts) {
  var transforms = [].concat(opts.transform)
    .filter(Boolean)
    .map(function(transform) {
      return (typeof transform === 'function') ?
        transform :
        require(resolve.sync(transform, {basedir: opts.basedir}));
    });

  if (opts.classMap)
    transforms.push(require('rework-classmap')(opts.classMap));

  return transforms;
}

/**
 * Run a pipeline of transform over stream of modules.
 *
 * @private
 * @param {Style} style
 * @param {Array<Function>} transforms
 */
function applyTransforms(style, transforms, opts) {
  opts = Object.create(opts);
  var promise = kew.resolve(style.stylesheet);

  transforms.forEach(function(transform) {
    promise = promise.then(function(stylesheet) {
      return applyTransform(stylesheet, transform, opts);
    });
  });

  return promise.then(function(stylesheet) {
    style.stylesheet = stylesheet;
    return style;
  });
}

function applyTransform(stylesheet, transform, opts) {
  return kew.resolve(transform(stylesheet, opts))
    .then(function(newStylesheet) {
      return newStylesheet || stylesheet;
    });
}

module.exports = xcss;
module.exports.bundle = bundle;

var fs       = require('fs');
var through  = require('through');
var bundle   = require('./index');
var css      = require('css');
var camelize = require('to-camel-case');

var isStylesheet = /\.(css|less|sass|scss|stylus)$/;

module.exports = function(w, opts, bundleOpts) {
  var entries = [];

  w.transform(function(filename) {
    if (!isStylesheet.exec(filename)) return through();

    return makeTransform(function(src) {
      var exports = {};
      var style = css.parse(src);
      style.stylesheet.rules.forEach(function(rule) {
        if (rule.type !== 'rule') return;

        var selector = rule.selectors[0];
        if (selector.indexOf('@export ') === 0) {
          var name = selector.slice(8);
          exports[camelize(name.slice(1))] = name.slice(1);
          rule.selectors = [name];
        }
      });
      entries.push({id: filename, source: css.stringify(style)});
      return 'module.exports = ' + JSON.stringify(exports) + ';';
    });
  });

  w.on('end', function() {
    var output = fs.createWriteStream(opts.out);
    bundle(entries, {debug: bundleOpts.debug})
      .on('error', w.throw.bind(w))
      .pipe(output);
  });
}

function makeTransform(fn) {
  var buffer = '';
  return through(
    function(chunk) { buffer += chunk; },
    function() {
      try {
        this.queue(fn(buffer));
      } catch (err) {
        this.emit('error', err);
      }
      this.queue(null);
    });
}

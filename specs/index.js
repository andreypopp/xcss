var assert  = require('assert');
var path    = require('path');
var fs      = require('fs');
var xcss    = require('../index');

var xcssModulePath = require.resolve('../index');

describe('xcss functional tests', function() {

  describe('xcss parsing', function() {
    var fixtures = path.join(__dirname, 'xcss');

    fs.readdirSync(fixtures).forEach(function(fixture) {
      if (!/\.xcss$/.exec(fixture) || fixture === 'module.xcss') return;

      it(fixture, function() {
        var file = path.join(fixtures, fixture);
        var css = require(file).toCSS() + '\n';
        var out = fs.readFileSync(file.replace(/\.xcss$/, '.css'), 'utf8');
        assert.strictEqual(css, out);
      });
    });
  });

  describe('css parsing', function() {
    var fixtures = path.join(__dirname, 'css');

    fs.readdirSync(fixtures).forEach(function(fixture) {
      if (!/\.css$/.exec(fixture)) return;


      it(fixture, function() {
        var file = path.join(fixtures, fixture);
        var css = require(file).toCSS() + '\n';
        var out = fs.readFileSync(file + '.out', 'utf8');
        assert.strictEqual(css, out);
      });
    });
  });

});

var assert  = require('assert');
var path    = require('path');
var fs      = require('fs');
var xcss    = require('../index');


describe('xcss', function() {

  var fixtures = path.join(__dirname, 'fixtures');
  var xcssModulePath = require.resolve('../index');

  fs.readdirSync(fixtures).forEach(function(fixture) {
    if (!/\.xcss$/.exec(fixture)) return;

    var file = path.join(fixtures, fixture);

    var css = require(file).toCSS() + '\n';
    var out = fs.readFileSync(file.replace(/\.xcss$/, '.css'), 'utf8');

    it(fixture, function() {
      assert.strictEqual(css, out);
    });
  });

});

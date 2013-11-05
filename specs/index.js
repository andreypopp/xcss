var assert = require('assert');
var utils = require('./utils');

function generateTestCase(cb, fixture, opts) {
  utils.bundle(fixture + '/main.css', opts).then(function(bundle) {
    utils.assertBundle(bundle, fixture + '/assert.css');
  }).then(cb, cb);
}

describe('xcss', function() {

  it('bundles deps', function(done) {
    generateTestCase(done, 'deps');
  });

  it('removes unused rule when classMap passed as an option', function(done) {
    generateTestCase(done, 'rm-unused', {classMap: {'.used': true}});
  });

  it('compresses rules when classMap passed as an option with string values', function(done) {
    generateTestCase(done, 'compress', {classMap: {'.used': '.A', '.unused': '.B'}});
  });

  it('respect "style" property of package.json', function(done) {
    generateTestCase(done, 'load-pkg-style');
  });

  it('emits source maps if passed debug option', function(done) {
    utils.bundle('deps/main.css', {debug: true}).then(function(bundle) {
      var map = bundle.match(/\/\*# sourceMappingURL=data:application\/json;base64,(.*)\*\//)[1];
      map = new Buffer(map, 'base64');
      map = map.toString();
      map = JSON.parse(map);
      assert.equal(map.sources.length, 2);
      assert.equal(map.sourcesContent.filter(Boolean).length, 2);
    }).then(done, done);
  });

});

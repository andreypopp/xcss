var assert = require('assert');
var utils = require('./utils');

describe('xcss', function() {

  it('bundles deps', function(done) {
    utils.bundle('deps/main.css').then(function(bundle) {
      utils.assertBundle(bundle, 'deps/assert.css');
    }).then(done, done);
  });

  it('removes unused rule when classMap passed as an option', function(done) {
    utils.bundle('rm-unused/main.css', {classMap: {'.used': true}}).then(function(bundle) {
      utils.assertBundle(bundle, 'rm-unused/assert.css');
    }).then(done, done);
  });

  it('compresses rules when classMap passed as an option with string values', function(done) {
    utils.bundle('compress/main.css', {classMap: {'.used': '.A', '.unused': '.B'}}).then(function(bundle) {
      utils.assertBundle(bundle, 'compress/assert.css');
    }).then(done, done);
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

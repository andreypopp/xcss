var assert = require('assert');
var fs = require('fs');
var path = require('path');
var aggregate = require('stream-aggregate-promise');
var xcss = require('../index');

function assertBundle(bundle, name) {
  assert.equal(bundle.trim(), fs.readFileSync(fixture(name), 'utf8').trim());
}

function fixture(name) {
  return path.join(__dirname, 'fixtures', name);
}

function bundle(name, opts) {
  return aggregate(xcss(fixture(name), opts));
}

function contains(bundle, pattern) {
  assert.ok(bundle.indexOf(pattern) > -1);
}

describe('xcss', function() {

  it('bundles deps', function(done) {
    bundle('deps/main.css').then(function(bundle) {
      assertBundle(bundle, 'deps/assert.css');
    }).then(done, done);
  });

  it('removes unused rule when classMap passed as an option', function(done) {
    bundle('rm-unused/main.css', {classMap: {'.used': true}}).then(function(bundle) {
      assertBundle(bundle, 'rm-unused/assert.css');
    }).then(done, done);
  });

  it('compresses rules when classMap passed as an option with string values', function(done) {
    bundle('compress/main.css', {classMap: {'.used': '.A', '.unused': '.B'}}).then(function(bundle) {
      assertBundle(bundle, 'compress/assert.css');
    }).then(done, done);
  });

  it('emits source maps if passed debug option', function(done) {
    bundle('deps/main.css', {debug: true}).then(function(bundle) {
      var map = bundle.match(/\/\*# sourceMappingURL=data:application\/json;base64,(.*)\*\//)[1];
      map = new Buffer(map, 'base64');
      map = map.toString();
      map = JSON.parse(map);
      assert.equal(map.sources.length, 2);
      assert.equal(map.sourcesContent.filter(Boolean).length, 2);
    }).then(done, done);
  });

});

var assert = require('assert');
var path = require('path');
var aggregate = require('stream-aggregate-promise');
var xcss = require('../index');

function fixture(name) {
  return path.join(__dirname, 'fixtures', name);
}

function bundle(name) {
  return aggregate(xcss(fixture(name)));
}

function contains(bundle, pattern) {
  assert.ok(bundle.indexOf(pattern) > -1);
}

describe('xcss', function() {

  it ('bundles deps', function(done) {
    bundle('deps/main.css').then(function(bundle) {
      contains(bundle, 'div');
      contains(bundle, 'body');
    }).then(done, done);
  });

});

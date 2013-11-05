var assert = require('assert');
var aggregate = require('stream-aggregate-promise');
var fs = require('fs');
var path = require('path');
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

module.exports = {
  assertBundle: assertBundle,
  fixture: fixture,
  bundle: bundle
};

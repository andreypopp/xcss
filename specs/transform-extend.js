var assert = require('assert');
var utils = require('./utils');

describe('extend transform', function() {
  it('allows to reuse rework-inherit', function(done) {
    utils.bundle('extend/main.css', {transform: './transforms/extend'})
      .then(function(bundle) {
        utils.assertBundle(bundle, 'extend/assert.css');
      }).then(done, done);
  });
});

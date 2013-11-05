var assert = require('assert');
var utils = require('./utils');

describe('autoprefixer transform', function() {
  it('allows to reuse autoprefixer', function(done) {
    utils.bundle('autoprefixer/main.css', {transform: './transforms/autoprefixer'})
      .then(function(bundle) {
        utils.assertBundle(bundle, 'autoprefixer/assert.css');
      }).then(done, done);
  });
});

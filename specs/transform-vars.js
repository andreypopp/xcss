var assert = require('assert');
var utils = require('./utils');

describe('vars transform', function() {
  it('allows to reuse rework-vars', function(done) {
    utils.bundle('vars/main.css', {
        vars: {height: '100px'},
        transform: './transforms/vars'
      }).then(function(bundle) {
        utils.assertBundle(bundle, 'vars/assert.css');
      }).then(done, done);
  });
});

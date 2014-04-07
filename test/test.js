var assert = require('assert');
var User = require('../user.js');

describe('User', function() {
    beforeEach(function(done) {
        User.create('apa', 'apa', function(err) {
            done();
        });
    });
    it('Cannot overwrite existing user', function(done) {
        User.create('apa', 'apa', function(err) {
            assert.notEqual(null, err);
            done();
        });
    });
    it('Can get existing user', function(done) {
        User.get('apa', 'apa', function(err, user) {
            assert.equal(null, err);
            done();
        });
    });
    it('Can delete existing user', function(done) {
        User.delete('apa', function(err) {
            assert.equal(null, err);
            done();
        });
    });
});

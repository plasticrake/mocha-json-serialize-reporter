/* globals setTimeout */
var assert = require('assert');

it('test in the root suite', function() {});

describe('suite one', function() {
  it('test that passes', function() {});

  it('test that fails (assert)', function() {
    assert.fail('FAIL');
  });

  it('test that fails (Error)', function() {
    throw new Error('FAIL');
  });

  it('test that is skipped', function() {
    this.skip();
  });

  it.skip('another test that is skipped', function() {});

  it('test that is slow', function(done) {
    this.slow(0);
    setTimeout(done, 1);
  });

  it('', function testWithNoTitle() {});

  describe('empty suite with nested', function() {
    describe('nested empty suite', function() {});
  });

  describe('nested suite', function() {
    it('nested suite test that passes', function() {});

    it('nested suite test that fails', function() {
      throw new Error('FAIL');
    });

    it('nested suite test that is skipped', function() {
      this.skip();
    });

    it.skip('nested suite another test that is skipped', function() {});
  });
});

describe('suite two', function() {
  it('test one', function() {});

  it('test two', function() {});

  it('test three', function() {});
});

describe('empty suite', function() {});

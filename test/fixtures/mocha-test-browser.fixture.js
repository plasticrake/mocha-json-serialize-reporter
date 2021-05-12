/* globals setTimeout */
it('test in the root suite', function () {});

describe('suite one', function () {
  it('test that passes', function () {});

  it('test that fails (Error)', function () {
    throw new Error('FAIL');
  });

  it('test that fails with circular Error', function () {
    var err = new Error('FAIL');
    err.self = err;
    throw err;
  });

  it('test that is skipped', function () {
    this.skip();
  });

  it.skip('another test that is skipped', function () {});

  it('test that is slow', function (done) {
    this.slow(0);
    setTimeout(done, 1);
  });

  it('', function testWithNoTitle() {});

  describe('empty suite with nested', function () {
    describe('nested empty suite', function () {});
  });

  describe('nested suite', function () {
    it('nested suite test that passes', function () {});

    it('nested suite test that fails', function () {
      throw new Error('FAIL');
    });

    it('nested suite test that is skipped', function () {
      this.skip();
    });

    it.skip('nested suite another test that is skipped', function () {});
  });
});

describe('suite two', function () {
  it('test one', function () {});

  it('test two', function () {});

  it('test three', function () {});
});

describe('suites with hooks', function () {
  describe('suite with beforeEach hook', function () {
    beforeEach(function () {});

    it('passing test', function () {});

    it('failing test', function () {
      throw new Error('FAIL');
    });

    it('skipped test', function () {
      this.skip();
    });
  });

  describe('suite with before hook', function () {
    before(function () {});

    it('passing test', function () {});

    it('failing test', function () {
      throw new Error('FAIL');
    });

    it('skipped test', function () {
      this.skip();
    });
  });

  describe('suite with afterEach hook', function () {
    afterEach(function () {});

    it('passing test', function () {});

    it('failing test', function () {
      throw new Error('FAIL');
    });

    it('skipped test', function () {
      this.skip();
    });
  });

  describe('suite with after hook', function () {
    after(function () {});

    it('passing test', function () {});

    it('failing test', function () {
      throw new Error('FAIL');
    });

    it('skipped test', function () {
      this.skip();
    });
  });

  describe('suite with failing beforeEach hook', function () {
    var count = 0;
    beforeEach(function failAfterOne() {
      if (count > 0) throw new Error('Before Each Hook Error');
      count += 1;
    });

    it('passing test', function () {});

    it('failing test', function () {
      throw new Error('FAIL');
    });

    it('skipped test', function () {
      this.skip();
    });
  });

  describe('suite with failing before hook', function () {
    before(function () {
      throw new Error('Before Hook Error');
    });

    it('passing test', function () {});

    it('failing test', function () {
      throw new Error('FAIL');
    });

    it('skipped test', function () {
      this.skip();
    });
  });

  describe('suite with failing afterEach hook', function () {
    var count = 0;

    afterEach(function failAfterOne() {
      if (count > 0) throw new Error('After Each Hook Error');
      count += 1;
    });

    it('passing test', function () {});

    it('failing test', function () {
      throw new Error('FAIL');
    });

    it('skipped test', function () {
      this.skip();
    });
  });

  describe('suite with failing after hook', function () {
    after(function fail() {
      throw new Error('After Hook Error');
    });

    it('passing test', function () {});

    it('failing test', function () {
      throw new Error('FAIL');
    });

    it('skipped test', function () {
      this.skip();
    });
  });
});

describe('empty suite', function () {});

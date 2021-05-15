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

  it('passing test 2', function () {});

  it('failing test', function () {
    throw new Error('FAIL');
  });

  it('skipped test', function () {
    this.skip();
  });

  describe('child suite', function () {
    it('passing test', function () {});
  });
});

describe('suite with failing before hook', function () {
  before(function () {
    throw new Error('Before Hook Error');
  });

  it('passing test', function () {});

  it('passing test 2', function () {});

  it('failing test', function () {
    throw new Error('FAIL');
  });

  it('skipped test', function () {
    this.skip();
  });

  describe('child suite', function () {
    it('passing test', function () {});
  });
});

describe('suite with failing afterEach hook', function () {
  var count = 0;

  afterEach(function failAfterOne() {
    if (count > 0) throw new Error('After Each Hook Error');
    count += 1;
  });

  it('passing test', function () {});

  it('passing test 2', function () {});

  it('failing test', function () {
    throw new Error('FAIL');
  });

  it('skipped test', function () {
    this.skip();
  });

  describe('child suite', function () {
    it('passing test', function () {});
  });
});

describe('suite with failing after hook', function () {
  after(function fail() {
    throw new Error('After Hook Error');
  });

  it('passing test', function () {});

  it('passing test2', function () {});

  it('failing test', function () {
    throw new Error('FAIL');
  });

  it('skipped test', function () {
    this.skip();
  });

  describe('child suite', function () {
    it('passing test', function () {});
  });
});

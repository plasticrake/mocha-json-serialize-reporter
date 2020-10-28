it('passing test in the root suite', function () {});

describe('suite one', function () {
  it('passing test', function () {});

  it('failing test', function () {
    throw new Error('FAIL');
  });

  it('skipped test', function () {
    this.skip();
  });
});

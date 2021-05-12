/* globals process setTimeout */
/* eslint-disable no-shadow, no-unused-expressions */
/* eslint no-underscore-dangle: ["error", { "allow": ["_beforeEach", "_beforeAll", "_afterEach", "_afterAll"] }] */

var expect = require('chai').expect;
var Mocha = require('mocha');
var sinon = require('sinon');

var JsonSerializeReporter = require('../lib/json-serialize-reporter');

var STATE_FAILED = 'failed';
var STATE_PASSED = 'passed';

function getTests(suite, matchFn) {
  var matchingTests = [];

  if (suite.tests != null) {
    suite.tests.forEach(function (t) {
      if (matchFn(t)) matchingTests.push(t);
    });
  }

  if (suite.suites != null) {
    suite.suites.forEach(function (s) {
      Array.prototype.push.apply(matchingTests, getTests(s, matchFn));
    });
  }

  return matchingTests;
}

function dateReviver(key, value) {
  if (key === 'end' || key === 'start') {
    return new Date(value);
  }
  return value;
}

function runReporter(reporterOptions, files, fn) {
  var mocha = new Mocha();
  mocha.reporter(JsonSerializeReporter, reporterOptions);

  if (files && files.length > 0) {
    files.forEach(function (file) {
      delete require.cache[require.resolve(file)];
      mocha.addFile('./test' + file.substring(1));
    });
  }

  var stdout = [];
  sinon.stub(process.stdout, 'write').callsFake(function (o) {
    stdout.push(o);
  });

  try {
    var runner = mocha.run(function () {
      sinon.restore();
      var jsonOutput = stdout.join('\n');

      setTimeout(function () {
        // setTimeout used so runner will have a value
        var objOutput;
        try {
          objOutput = JSON.parse(jsonOutput, dateReviver);
        } catch (err) {
          objOutput = String(err);
        }

        if (typeof runner.dispose === 'function') runner.dispose();

        fn({
          runner: runner,
          jsonOutput: jsonOutput,
          objOutput: objOutput,
        });
      }, 0);
    });
  } catch (err) {
    sinon.restore();
    throw err;
  }
}

describe('JsonSerializeReporter', function () {
  var runner;
  var objOutput;

  beforeEach(function (done) {
    runReporter({}, ['./fixtures/mocha-test.fixture.js'], function (out) {
      runner = out.runner;
      objOutput = out.objOutput;
      done();
    });
  });

  describe('hooks', function () {
    var suiteWithBeforeEachHook;
    var suiteWithBeforeHook;
    var suiteWithAfterEachHook;
    var suiteWithAfterHook;

    var suiteWithFailingBeforeEachHook;
    var suiteWithFailingBeforeHook;
    var suiteWithFailingAfterEachHook;
    var suiteWithFailingAfterHook;

    beforeEach(function (done) {
      runReporter(
        {},
        ['./fixtures/mocha-test-hooks.fixture.js'],
        function (out) {
          suiteWithBeforeEachHook = out.objOutput.suite.suites[0];
          suiteWithBeforeHook = out.objOutput.suite.suites[1];
          suiteWithAfterEachHook = out.objOutput.suite.suites[2];
          suiteWithAfterHook = out.objOutput.suite.suites[3];

          suiteWithFailingBeforeEachHook = out.objOutput.suite.suites[4];
          suiteWithFailingBeforeHook = out.objOutput.suite.suites[5];
          suiteWithFailingAfterEachHook = out.objOutput.suite.suites[6];
          suiteWithFailingAfterHook = out.objOutput.suite.suites[7];

          done();
        }
      );
    });

    it('should have output', function () {
      expect(suiteWithBeforeHook).to.exist;
      expect(suiteWithBeforeEachHook).to.exist;
    });

    it('should have hooks', function () {
      expect(suiteWithBeforeEachHook)
        .to.have.property('_beforeEach')
        .with.lengthOf(1);
      expect(suiteWithBeforeHook)
        .to.have.property('_beforeAll')
        .with.lengthOf(1);
      expect(suiteWithAfterEachHook)
        .to.have.property('_afterEach')
        .with.lengthOf(1);
      expect(suiteWithAfterHook).to.have.property('_afterAll').with.lengthOf(1);
      expect(suiteWithFailingBeforeEachHook)
        .to.have.property('_beforeEach')
        .with.lengthOf(1);
      expect(suiteWithFailingBeforeHook)
        .to.have.property('_beforeAll')
        .with.lengthOf(1);
      expect(suiteWithFailingAfterEachHook)
        .to.have.property('_afterEach')
        .with.lengthOf(1);
      expect(suiteWithFailingAfterHook)
        .to.have.property('_afterAll')
        .with.lengthOf(1);
    });

    it('failures should have originalTitle (Mocha >= v6)', function () {
      if (
        !(
          Mocha.prototype.version &&
          Number(Mocha.prototype.version.substring(0, 1)) >= 6
        )
      ) {
        this.skip();
      }

      [
        suiteWithFailingBeforeEachHook._beforeEach[0],
        suiteWithFailingBeforeHook._beforeAll[0],
        suiteWithFailingAfterEachHook._afterEach[0],
        suiteWithFailingAfterHook._afterAll[0],
      ].forEach(function (hook, i) {
        expect(hook, String(i)).to.have.property('originalTitle');
      });
    });
  });

  it('should have output', function () {
    expect(objOutput).to.exist;
  });

  it('should have stats', function () {
    var stats = objOutput.stats;
    expect(objOutput).to.have.property('stats');
    expect(stats).to.have.property('suites').is.a('number');
    expect(stats).to.have.property('tests').is.a('number');
    expect(stats).to.have.property('passes').is.a('number');
    expect(stats).to.have.property('pending').is.a('number');
    expect(stats).to.have.property('failures').is.a('number');
    expect(stats).to.have.property('start').is.a('date');
    expect(stats).to.have.property('end').is.a('date');
    expect(stats).to.have.property('duration').is.a('number');
  });

  it('should have a suite (root)', function () {
    expect(objOutput).to.have.property('suite');
    expect(objOutput.suite).to.have.property('root', true);
    expect(objOutput.suite).to.have.property('title').that.is.a('string');
  });

  describe('options', function () {
    describe('stats', function () {
      it('should include stats by default', function (done) {
        runReporter(undefined, [], function (out) {
          expect(out.objOutput).to.have.property('stats').and.to.exist;
          done();
        });
      });

      it('should include stats when stats is true', function (done) {
        runReporter({ stats: true }, [], function (out) {
          expect(out.objOutput).to.have.property('stats').and.to.exist;
          done();
        });
      });

      ['true', 'yes', 'on', '1', 'literally anything else'].forEach(function (
        val
      ) {
        it('should include stats when stats is "' + val + '"', function (done) {
          runReporter({ stats: val }, [], function (out) {
            expect(out.objOutput).to.have.property('stats').and.to.exist;
            done();
          });
        });
      });

      it('should not have stats when stats is false', function (done) {
        runReporter({ stats: false }, [], function (out) {
          expect(out.objOutput).to.not.have.property('stats');
          done();
        });
      });

      ['false', 'no', 'off', '0'].forEach(function (val) {
        it(
          'should not have stats when stats is "' + val + '"',
          function (done) {
            runReporter({ stats: val }, [], function (out) {
              expect(out.objOutput).to.not.have.property('stats');
              done();
            });
          }
        );
      });
    });

    describe('space', function () {
      it('should default to 2', function (done) {
        runReporter(undefined, [], function (out) {
          expect(out.jsonOutput).to.contain(
            '{\n  "suite": {\n    "title": "",\n'
          );
          done();
        });
      });

      it('should default to 2 with an invalid number', function (done) {
        runReporter({ space: 'INVALID' }, [], function (out) {
          expect(out.jsonOutput).to.contain(
            '{\n  "suite": {\n    "title": "",\n'
          );
          done();
        });
      });

      it('should allow overrides', function (done) {
        runReporter({ space: 0 }, [], function (out) {
          expect(out.jsonOutput).to.match(/{"suite":{"title":""/);
          done();
        });
      });
    });

    describe('replacer', function () {
      it('should allow overrides', function (done) {
        var replacer = function (key, value) {
          if (key === 'stats') {
            return 'OVERRIDE';
          }
          return value;
        };
        runReporter({ replacer: replacer }, [], function (out) {
          expect(out.objOutput.stats).to.eql('OVERRIDE');
          done();
        });
      });

      [99, new Date(), 'not a function', {}].forEach(function (val) {
        it('should ignore non-functions: "' + val + '"', function (done) {
          runReporter({ replacer: val }, [], function () {
            done();
          });
        });
      });
    });
  });

  describe('suites', function () {
    var suites;

    function getSuites(suites, matchFn) {
      var matchingSuites = [];

      suites.forEach(function (suite) {
        if (suite == null) return;

        if (matchFn(suite)) matchingSuites.push(suite);

        if (suite.suites != null) {
          Array.prototype.push.apply(
            matchingSuites,
            getSuites(suite.suites, matchFn)
          );
        }
      });

      return matchingSuites;
    }

    before(function () {
      // root suite and empty suites are not counted in stats
      suites = getSuites(objOutput.suite.suites, function (s) {
        // walk the tree and see if we find a test
        return (
          getTests(s, function () {
            return true;
          }).length > 0
        );
      });
    });

    it('should match stats', function () {
      var stats = objOutput.stats;
      expect(suites).lengthOf(stats.suites);
    });
  });

  describe('tests', function () {
    var tests;
    var passes;
    var pending;
    var failures;

    before(function () {
      tests = getTests(objOutput.suite, function (test) {
        // excludes tests that were not run due to hook failures
        return test.state != null || test.pending;
      });
      passes = getTests(objOutput.suite, function (test) {
        return test.state === STATE_PASSED;
      });
      pending = getTests(objOutput.suite, function (test) {
        return test.pending;
      });
      failures = getTests(objOutput.suite, function (test) {
        return test.state === STATE_FAILED;
      });
    });

    it('should match stats: tests', function () {
      expect(tests).lengthOf(objOutput.stats.tests);
    });

    it('should match stats: passes', function () {
      expect(passes).lengthOf(objOutput.stats.passes);
    });

    it('should match stats: pending', function () {
      expect(pending).lengthOf(objOutput.stats.pending);
    });

    it('should have 10 failures', function () {
      // This won't match stats when suites have failing hooks
      expect(failures).lengthOf(10);
    });

    describe('failures', function () {
      it('should have err', function () {
        failures.forEach(function (f) {
          expect(f, f.title).to.have.property('err').that.exist;
        });
      });
    });
  });

  describe('testResults', function () {
    it('should match stdout JSON Output', function () {
      expect(runner.testResults).to.eql(objOutput);
    });
  });

  describe('No Tests', function () {
    var runner;
    var objOutput;

    before(function (done) {
      runReporter({}, [], function (out) {
        runner = out.runner;
        objOutput = out.objOutput;
        done();
      });
    });

    it('should have output', function () {
      expect(objOutput).to.exist;
    });

    it('should have stats', function () {
      expect(objOutput).to.have.property('stats');
    });

    it('should have a suite (root)', function () {
      expect(objOutput).to.have.property('suite');
      expect(objOutput.suite).to.have.property('root', true);
    });

    describe('suite (root)', function () {
      it('should not have tests or suites', function () {
        expect(objOutput.suite).to.not.have.property('suites');
        expect(objOutput.suite).to.not.have.property('tests');
      });
    });

    describe('testResults', function () {
      it('should match stdout JSON output', function () {
        expect(runner.testResults).to.eql(objOutput);
      });
    });
  });
});

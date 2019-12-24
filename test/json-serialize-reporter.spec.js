/* globals process setTimeout */
/* eslint-disable no-shadow, no-unused-expressions */

var expect = require('chai').expect;
var Mocha = require('mocha');
var sinon = require('sinon');

var JsonSerializeReporter = require('../lib/json-serialize-reporter');

var STATE_FAILED = 'failed';
var STATE_PASSED = 'passed';

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
    files.forEach(function(file) {
      delete require.cache[require.resolve(file)];
      mocha.addFile('./test' + file.substring(1));
    });
  }

  var stdout = [];
  sinon.stub(process.stdout, 'write').callsFake(function(o) {
    stdout.push(o);
  });

  try {
    var runner = mocha.run(function() {
      sinon.restore();
      var jsonOutput = stdout.join('\n');

      setTimeout(function() {
        // setTimeout used so runner will have a value
        fn({
          runner: runner,
          jsonOutput: jsonOutput,
          objOutput: JSON.parse(jsonOutput, dateReviver),
        });
      }, 0);
    });
  } catch (err) {
    sinon.restore();
    throw err;
  }
}

describe('JsonSerializeReporter', function() {
  var runner;
  var objOutput;

  beforeEach(function(done) {
    runReporter({}, ['./fixtures/mocha-test.fixture.js'], function(out) {
      runner = out.runner;
      objOutput = out.objOutput;
      done();
    });
  });

  it('should have output', function() {
    expect(objOutput).to.exist;
  });

  it('should have stats', function() {
    var stats = objOutput.stats;
    expect(objOutput).to.have.property('stats');
    expect(stats)
      .to.have.property('suites')
      .is.a('number');
    expect(stats)
      .to.have.property('tests')
      .is.a('number');
    expect(stats)
      .to.have.property('passes')
      .is.a('number');
    expect(stats)
      .to.have.property('pending')
      .is.a('number');
    expect(stats)
      .to.have.property('failures')
      .is.a('number');
    expect(stats)
      .to.have.property('start')
      .is.a('date');
    expect(stats)
      .to.have.property('end')
      .is.a('date');
    expect(stats)
      .to.have.property('duration')
      .is.a('number');
  });

  it('should have a suite (root)', function() {
    expect(objOutput).to.have.property('suite');
    expect(objOutput.suite).to.have.property('root', true);
    expect(objOutput.suite)
      .to.have.property('title')
      .that.is.a('string');
  });

  describe('options', function() {
    describe('stats', function() {
      it('should include stats by default', function(done) {
        runReporter(undefined, [], function(out) {
          expect(out.objOutput).to.have.property('stats').and.to.exist;
          done();
        });
      });

      it('should include stats when stats is true', function(done) {
        runReporter({ stats: true }, [], function(out) {
          expect(out.objOutput).to.have.property('stats').and.to.exist;
          done();
        });
      });

      ['true', 'yes', 'on', '1', 'literally anything else'].forEach(function(
        val
      ) {
        it('should include stats when stats is "' + val + '"', function(done) {
          runReporter({ stats: val }, [], function(out) {
            expect(out.objOutput).to.have.property('stats').and.to.exist;
            done();
          });
        });
      });

      it('should not have stats when stats is false', function(done) {
        runReporter({ stats: false }, [], function(out) {
          expect(out.objOutput).to.not.have.property('stats');
          done();
        });
      });

      ['false', 'no', 'off', '0'].forEach(function(val) {
        it('should not have stats when stats is "' + val + '"', function(done) {
          runReporter({ stats: val }, [], function(out) {
            expect(out.objOutput).to.not.have.property('stats');
            done();
          });
        });
      });
    });

    describe('space', function() {
      it('should default to 2', function(done) {
        runReporter(undefined, [], function(out) {
          expect(out.jsonOutput).to.contain(
            '{\n  "suite": {\n    "title": "",\n'
          );
          done();
        });
      });

      it('should default to 2 with an invalid number', function(done) {
        runReporter({ space: 'INVALID' }, [], function(out) {
          expect(out.jsonOutput).to.contain(
            '{\n  "suite": {\n    "title": "",\n'
          );
          done();
        });
      });

      it('should allow overrides', function(done) {
        runReporter({ space: 0 }, [], function(out) {
          expect(out.jsonOutput).to.match(/{"suite":{"title":""/);
          done();
        });
      });
    });

    describe('replacer', function() {
      it('should allow overrides', function(done) {
        var replacer = function(key, value) {
          if (key === 'stats') {
            return 'OVERRIDE';
          }
          return value;
        };
        runReporter({ replacer: replacer }, [], function(out) {
          expect(out.objOutput.stats).to.eql('OVERRIDE');
          done();
        });
      });

      [99, new Date(), 'not a function', {}].forEach(function(val) {
        it('should ignore non-functions: "' + val + '"', function(done) {
          runReporter({ replacer: val }, [], function() {
            done();
          });
        });
      });
    });
  });

  describe('suites', function() {
    var suites;

    function getSuites(suite, matchFn) {
      if (suite == null || suite.suites == null) return null;
      var matchingSuites = [];
      suite.suites.forEach(function(s) {
        if (matchFn(s)) matchingSuites.push(s);
        Array.prototype.push.apply(matchingSuites, getSuites(s, matchFn));
      });
      return matchingSuites;
    }

    before(function() {
      // root suite and empty suites are not counted in stats
      suites = getSuites(objOutput.suite, function(s) {
        return s.tests && s.tests.length > 0;
      });
    });

    it('should match stats', function() {
      var stats = objOutput.stats;
      expect(suites).lengthOf(stats.suites);
    });
  });

  describe('tests', function() {
    var tests;
    var passes;
    var pending;
    var failures;

    function getTests(suite, matchFn) {
      if (suite.tests == null) return null;
      var matchingTests = [];
      suite.tests.forEach(function(t) {
        if (matchFn(t)) matchingTests.push(t);
      });

      if (suite.suites) {
        suite.suites.forEach(function(s) {
          Array.prototype.push.apply(matchingTests, getTests(s, matchFn));
        });
      }

      return matchingTests;
    }

    before(function() {
      tests = getTests(objOutput.suite, function() {
        return true;
      });
      passes = getTests(objOutput.suite, function(test) {
        return test.state === STATE_PASSED;
      });
      pending = getTests(objOutput.suite, function(test) {
        return test.pending;
      });
      failures = getTests(objOutput.suite, function(test) {
        return test.state === STATE_FAILED;
      });
    });

    it('should match stats', function() {
      var stats = objOutput.stats;
      expect(tests).lengthOf(stats.tests);
      expect(passes).lengthOf(stats.passes);
      expect(pending).lengthOf(stats.pending);
      expect(tests).lengthOf(stats.tests);
      expect(failures).lengthOf(stats.failures);
    });

    describe('failures', function() {
      it('should have err', function() {
        failures.forEach(function(f) {
          expect(f, f.title).to.have.property('err').that.exist;
        });
      });
    });
  });

  describe('testResults', function() {
    it('should match stdout JSON Output', function() {
      expect(runner.testResults).to.eql(objOutput);
    });
  });

  describe('No Tests', function() {
    var runner;
    var objOutput;

    before(function(done) {
      runReporter({}, [], function(out) {
        runner = out.runner;
        objOutput = out.objOutput;
        done();
      });
    });

    it('should have output', function() {
      expect(objOutput).to.exist;
    });

    it('should have stats', function() {
      expect(objOutput).to.have.property('stats');
    });

    it('should have a suite (root)', function() {
      expect(objOutput).to.have.property('suite');
      expect(objOutput.suite).to.have.property('root', true);
    });

    describe('suite (root)', function() {
      it('should not have tests or suites', function() {
        expect(objOutput.suite).to.not.have.property('suites');
        expect(objOutput.suite).to.not.have.property('tests');
      });
    });

    describe('testResults', function() {
      it('should match stdout JSON output', function() {
        expect(runner.testResults).to.eql(objOutput);
      });
    });
  });
});

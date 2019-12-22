/* globals process */
/* eslint-disable no-unused-expressions */

var expect = require('chai').expect;
var Mocha = require('mocha');
var sinon = require('sinon');

var JsonSerializeReporter = require('../lib/json-serialize-reporter');

var STATE_FAILED = 'failed';
var STATE_PASSED = 'passed';

describe('JsonSerializeReporter', function() {
  var stdout;
  var runner;
  var jsonOutput;
  var objOutput;

  var gather = function gather(chunk) {
    stdout.push(chunk);
  };

  var dateReviver = function dateReviver(key, value) {
    if (key === 'end' || key === 'start') {
      return new Date(value);
    }
    return value;
  };

  beforeEach(function(done) {
    var mocha = new Mocha();
    mocha.reporter(JsonSerializeReporter);

    delete require.cache[require.resolve('./fixtures/mocha-test.fixture.js')];
    mocha.addFile('./test/fixtures/mocha-test.fixture.js');

    stdout = [];
    sinon.stub(process.stdout, 'write').callsFake(gather);
    try {
      runner = mocha.run(function() {
        sinon.restore();
        jsonOutput = stdout.join('\n');
        objOutput = JSON.parse(jsonOutput, dateReviver);

        done();
      });
    } catch (e) {
      sinon.restore();
    }
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
    // eslint-disable-next-line no-shadow
    var runner;
    // eslint-disable-next-line no-shadow
    var jsonOutput;
    // eslint-disable-next-line no-shadow
    var objOutput;

    before(function(done) {
      var mocha = new Mocha();
      mocha.reporter(JsonSerializeReporter);

      stdout = [];
      sinon.stub(process.stdout, 'write').callsFake(gather);
      runner = mocha.run(function() {
        sinon.restore();
        jsonOutput = stdout.join('\n');
        objOutput = JSON.parse(jsonOutput, dateReviver);
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

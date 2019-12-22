/* globals process */

/**
 * The `Mocha` namespace
 * @external Mocha
 * @see https://mochajs.org/api/
 */
var Mocha = require('Mocha');
var Base = Mocha.reporters.Base;
var EVENT_RUN_END = Mocha.Runner.constants.EVENT_RUN_END;

/**
 * Transform an Error object into a JSON object.
 *
 * @private
 * @param {Error?} err
 * @return {Object?}
 */
function errorJson(err) {
  var res = {};
  if (err == null) return err;

  Object.getOwnPropertyNames(err).forEach(function(key) {
    res[key] = err[key];
  }, err);
  res.constructorName = err.constructor.name;
  return res;
}

/**
 * Replaces any circular references inside `obj` with '[object Object]'
 *
 * @private
 * @param {Object?} obj
 * @return {Object?}
 */
function decycle(obj) {
  var cache = [];
  if (obj == null) return obj;

  return JSON.parse(
    JSON.stringify(obj, function replacer(key, value) {
      if (typeof value === 'object' && value !== null) {
        if (cache.indexOf(value) !== -1) {
          return '' + value;
        }
        cache.push(value);
      }

      return value;
    })
  );
}

/**
 * Returns a JSON object from a `Mocha.Test` object
 *
 * @private
 * @param {external:Mocha.Test} test
 * @returns {Object}
 */
function testToJsonObject(test) {
  var outTest = {};

  // copy properties
  [
    'title',
    'body',
    'timedOut',
    'pending',
    'type',
    'file',
    'duration',
    'state',
    'speed',
  ].forEach(function(prop) {
    if (test[prop] === undefined) return;
    outTest[prop] = test[prop];
  });

  // copy getters
  ['timeout', 'slow', 'retries', 'currentRetry', 'enableTimeouts'].forEach(
    function(prop) {
      if (test[prop]() === undefined) return;
      outTest[prop] = test[prop]();
    }
  );

  if (test.err !== undefined) {
    var err = test.err;
    if (err instanceof Error) {
      err = errorJson(err);
    }
    outTest.err = decycle(err);
  }

  return outTest;
}

/**
 * Returns a JSON object from a `Mocha.Suite` object
 *
 * Recurses on child suites and tests.
 *
 * @private
 * @param {external:Mocha.Suite} suite
 * @returns {Object}
 */
function suiteToJsonObject(suite) {
  var outSuite = {};

  // copy properties
  ['title', 'suites', 'tests', 'pending', 'root', 'file'].forEach(function(
    prop
  ) {
    if (suite[prop] === undefined) return;
    outSuite[prop] = suite[prop];
  });

  // copy getters
  ['timeout', 'slow', 'retries', 'enableTimeouts'].forEach(function(prop) {
    if (suite[prop]() === undefined) return;
    outSuite[prop] = suite[prop]();
  });

  outSuite.tests = suite.tests.map(testToJsonObject);
  outSuite.suites = suite.suites.map(suiteToJsonObject);
  return outSuite;
}

/**
 * Constructs a new `JsonSerializeReporter` reporter instance.
 *
 * @class
 * @extends external:Mocha.reporters.Base
 * @param {Runner} runner Instance triggers reporter actions.
 * @param {Object} [options] runner options
 */
function JsonSerializeReporter(runner, options) {
  Base.call(this, runner, options);

  var self = this;

  runner.once(EVENT_RUN_END, function onRunEnd() {
    var obj = {
      stats: self.stats,
      suite: suiteToJsonObject(runner.suite),
    };

    // Mimicking Mocha.reporters.JSONReporter behavior
    // eslint-disable-next-line no-param-reassign
    runner.testResults = obj;

    process.stdout.write(JSON.stringify(obj, null, 2));
  });
}

Object.setPrototypeOf(JsonSerializeReporter.prototype, Base.prototype);

module.exports = JsonSerializeReporter;

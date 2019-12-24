/* globals process */

'use strict';

/**
 * The `Mocha` namespace
 * @external Mocha
 * @see https://mochajs.org/api/
 */
var Mocha = require('mocha');
var Base = Mocha.reporters.Base;
var EVENT_RUN_END = 'end';

function isString(obj) {
  return typeof obj === 'string';
}

function isFunction(functionToCheck) {
  return (
    functionToCheck && {}.toString.call(functionToCheck) === '[object Function]'
  );
}

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
 * Copies properties from `src` to `dest` when value is not undefined
 *
 * @private
 * @param {Object} src
 * @param {Object} dest
 * @param {string[]} props
 */
function copyProperties(src, dest, props) {
  props.forEach(function(prop) {
    if (src[prop] === undefined) return;
    // eslint-disable-next-line no-param-reassign
    dest[prop] = src[prop];
  });
}

/**
 * Copies output of getters from `src` to a property on `dest` when output
 * is not undefined
 *
 * @private
 * @param {Object} src
 * @param {Object} dest
 * @param {string[]} props
 */
function copyGetters(src, dest, props) {
  props.forEach(function(prop) {
    if (src[prop]() === undefined) return;
    // eslint-disable-next-line no-param-reassign
    dest[prop] = src[prop]();
  });
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

  copyProperties(test, outTest, [
    'title',
    'body',
    'timedOut',
    'pending',
    'type',
    'file',
    'duration',
    'state',
    'speed',
  ]);

  copyGetters(test, outTest, [
    'timeout',
    'slow',
    'retries',
    'currentRetry',
    'enableTimeouts',
  ]);

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

  copyProperties(suite, outSuite, ['title', 'pending', 'root', 'file']);

  copyGetters(suite, outSuite, [
    'timeout',
    'slow',
    'retries',
    'enableTimeouts',
  ]);

  if (suite.tests && suite.tests.length > 0) {
    outSuite.tests = suite.tests.map(testToJsonObject);
  }
  if (suite.suites && suite.suites.length > 0) {
    outSuite.suites = suite.suites.map(suiteToJsonObject);
  }
  return outSuite;
}

function parseBooleanOption(opt) {
  if (isString(opt)) {
    switch (opt.toLowerCase().trim()) {
      case 'false':
      case 'no':
      case 'off':
      case '0':
        return false;
      default:
        return true;
    }
  } else {
    return Boolean(opt);
  }
}

function parseOptions(defaults, input) {
  var opts = defaults;

  if (input == null || input.reporterOptions == null) {
    return opts;
  }

  var inOpts = input.reporterOptions;

  if (inOpts.stats !== undefined) {
    opts.includeStats = parseBooleanOption(inOpts.stats);
  }

  if (inOpts.replacer !== undefined && isFunction(inOpts.replacer)) {
    opts.replacer = inOpts.replacer;
  }

  // eslint-disable-next-line no-restricted-globals
  if (inOpts.space !== undefined && !isNaN(Number(inOpts.space))) {
    opts.space = Number(inOpts.space);
  }

  return opts;
}

/**
 * Constructs a new `JsonSerializeReporter` reporter instance.
 *
 * @class
 * @extends external:Mocha.reporters.Base
 * @param {external:Mocha.Runner} runner Instance triggers reporter actions.
 * @param {Object}         [options] runner options
 * @param {boolean|string} [options.reporterOptions.stats=true] include stats
 * @param {Function}       [options.reporterOptions.replacer=null] replacer parameter passed to `JSON.stringify`
 * @param {number|string}  [options.reporterOptions.space=2] space parameter passed to `JSON.stringify`
 */
function JsonSerializeReporter(runner, options) {
  Base.call(this, runner, options);

  var self = this;

  var opts = parseOptions(
    {
      includeStats: true,
      replacer: null,
      space: 2,
    },
    options
  );

  runner.once(EVENT_RUN_END, function onRunEnd() {
    var obj = { suite: suiteToJsonObject(runner.suite) };

    if (opts.includeStats) {
      obj.stats = self.stats;
    }

    // Mimicking Mocha.reporters.JSONReporter behavior
    // eslint-disable-next-line no-param-reassign
    runner.testResults = obj;

    process.stdout.write(JSON.stringify(obj, opts.replacer, opts.space));
  });
}

Object.setPrototypeOf(JsonSerializeReporter.prototype, Base.prototype);

module.exports = JsonSerializeReporter;

/* globals process */

'use strict';

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

function reduceRemoveNull(acc, currVal) {
  if (!(currVal == null)) {
    acc.push(currVal);
  }
  return acc;
}

/**
 * Transform an Error object into a JSON object.
 *
 * @private
 * @param {Error} err
 * @return {Object}
 */
function errorJson(err) {
  var res = {};

  Object.getOwnPropertyNames(err).forEach(function (key) {
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

  var stringified;

  if ('toJSON' in obj && typeof obj.toJSON === 'function') {
    try {
      stringified = obj.toJSON();
    } catch (err) {
      stringified = 'toJSON() error: ' + err.message;
    }
  } else {
    var replacerObjCache = function replacerObjCache(key, value) {
      if (typeof value === 'object' && value !== null) {
        if (cache.indexOf(value) !== -1) {
          return '' + value;
        }
        cache.push(value);
      }

      return value;
    };

    var replacerToJSONSafe = function replacerToJSONSafe(key, value) {
      // Removes all toJSON methods from objects
      if (typeof value === 'object' && value !== null) {
        // eslint-disable-next-line no-param-reassign
        value = replacerObjCache(key, value);

        Object.keys(value).forEach(function (propKey) {
          if (
            value[propKey] != null &&
            'toJSON' in value[propKey] &&
            typeof value[propKey].toJSON === 'function'
          ) {
            // eslint-disable-next-line no-param-reassign
            value[propKey].toJSON = undefined;
          }
        });
      }

      return value;
    };

    try {
      stringified = JSON.stringify(obj, replacerObjCache);
    } catch (errIgnored) {
      try {
        cache = [];
        stringified = JSON.stringify(obj, replacerToJSONSafe);
      } catch (err) {
        stringified = 'JSON.stringify() error: ' + err.message;
      }
    }
  }

  try {
    return JSON.parse(stringified);
  } catch (err) {
    return 'JSON.parse error: ' + err.message;
  }
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
  props.forEach(function (prop) {
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
  props.forEach(function (prop) {
    if (typeof src[prop] !== 'function') {
      throw new Error(
        'Expected ' +
          prop +
          ' to be type of Function but found ' +
          typeof src[prop]
      );
    }
    if (src[prop]() === undefined) return;
    // eslint-disable-next-line no-param-reassign
    dest[prop] = src[prop]();
  });
}

/**
 * Mocha starting with v8 will set the `state` of pending tests to 'pending'
 * Mocha versions before v8 do not add a `state` to pending tests
 * Mocha starting with version 6 provides `Mocha.prototype.version`
 */
function MochaSetsStateToPending() {
  if (Mocha.prototype.version != null) {
    return Number(Mocha.prototype.version.split('.')[0]) >= 8;
  }
  return false;
}

/**
 * Returns a JSON object from a `Mocha.Runnable` object
 *
 * @private
 * @param {Mocha.Runnable} test
 * @returns {Object}
 */
function runnableToJsonObject(runnable) {
  var outRunnable = {};

  if (
    // include hooks
    runnable.type !== 'hook' &&
    // MochaSetsStateToPending())
    // For newer mocha versions, exclude pending tests without pending state
    MochaSetsStateToPending() &&
    runnable.pending === true &&
    runnable.state === undefined
  ) {
    return undefined;
  }

  copyProperties(runnable, outRunnable, [
    'title',
    'originalTitle',
    'body',
    'timedOut',
    'pending',
    'type',
    'file',
    'duration',
    'state',
    'speed',
  ]);

  copyGetters(runnable, outRunnable, [
    'timeout',
    'slow',
    'retries',
    'currentRetry',
  ]);

  if (runnable.err !== undefined) {
    var err = runnable.err;
    if (err instanceof Error) {
      err = errorJson(err);
    }
    outRunnable.err = decycle(err);
  }

  return outRunnable;
}

/**
 * Returns a JSON object from a `Mocha.Suite` object
 *
 * Recurses on child suites and tests.
 *
 * @private
 * @param {Mocha.Suite} suite
 * @returns {Object}
 */
function suiteToJsonObject(suite) {
  var outSuite = {};

  copyProperties(suite, outSuite, ['title', 'pending', 'root', 'file']);

  copyGetters(suite, outSuite, ['timeout', 'slow', 'retries']);

  ['_beforeEach', '_beforeAll', '_afterEach', '_afterAll'].forEach(function (
    hooks
  ) {
    if (suite[hooks] != null && suite[hooks].length > 0) {
      outSuite[hooks] = [];
      suite[hooks].forEach(function (hook) {
        outSuite[hooks].push(runnableToJsonObject(hook));
      });
    }
  });

  if (suite.tests && suite.tests.length > 0) {
    outSuite.tests = suite.tests
      .map(runnableToJsonObject)
      .reduce(reduceRemoveNull, []);
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

  if (inOpts.callback !== undefined && isFunction(inOpts.callback)) {
    opts.callback = inOpts.callback;
  }

  return opts;
}

/**
 * Constructs a new `JsonSerializeReporter` reporter instance.
 *
 * @class
 * @extends Mocha.reporters.Base
 * @param {Mocha.Runner} runner Instance triggers reporter actions.
 * @param {Object}         [options] runner options
 * @param {boolean|string} [options.reporterOptions.stats=true] include stats
 * @param {Function}       [options.reporterOptions.replacer=null] replacer parameter passed to `JSON.stringify`
 * @param {number|string}  [options.reporterOptions.space=2] space parameter passed to `JSON.stringify`
 * @param {Function}       [options.reporterOptions.callback=null] callback function for results, if specified does not output to stdout/console
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

    var results = JSON.stringify(obj, opts.replacer, opts.space);

    if (opts.callback) {
      opts.callback(results);
    } else {
      process.stdout.write(results);
    }
  });
}

module.exports = JsonSerializeReporter;

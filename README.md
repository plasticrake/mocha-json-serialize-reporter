# Mocha.js JSON Serialize Reporter

[![NPM Version](https://img.shields.io/npm/v/mocha-json-serialize-reporter.svg)](https://www.npmjs.com/package/mocha-json-serialize-reporter)
[![Build Status](https://travis-ci.com/plasticrake/mocha-json-serialize-reporter.svg?branch=master)](https://travis-ci.com/plasticrake/mocha-json-serialize-reporter)
[![codecov](https://codecov.io/gh/plasticrake/mocha-json-serialize-reporter/branch/master/graph/badge.svg)](https://codecov.io/gh/plasticrake/mocha-json-serialize-reporter)
[![Total alerts](https://img.shields.io/lgtm/alerts/g/plasticrake/mocha-json-serialize-reporter.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/plasticrake/mocha-json-serialize-reporter/alerts/)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/plasticrake/mocha-json-serialize-reporter.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/plasticrake/mocha-json-serialize-reporter/context:javascript)

**A comprehensive JSON reporter for [Mocha.js](https://mochajs.org/)**

Output can be used with [mocha-json-runner](https://github.com/plasticrake/mocha-json-runner) to "replay" test results using another mocha reporter.

Differs from the built-in Mocha JSON reporter:

- includes suite level details
- includes nearly all internal details about tests and suites

## Usage

1. Add to your project

```bash
npm install --save-dev mocha-json-serialize-reporter
```

or globally

```bash
npm install --global mocha-json-serialize-reporter
```

2. Tell mocha to use it:

```bash
mocha testfile.js --reporter mocha-json-serialize-reporter
```

3. If using mocha programatically:

```js
var mocha = new Mocha({
  reporter: 'mocha-json-serialize-reporter',
});
```

### Options

- `stats` \[boolean\] \[default: true\] include stats in output.
- `space` \[number\] \[default: 2\] `JSON.stringify` space parameter.
- `replacer` \[Function\] \[default: null\] `JSON.stringify` replacer function. This is only usable programatically, not via command line.

Example:

```bash
mocha testfile.js --reporter mocha-json-serialize-reporter -O stats=false -O space=0
```

## Output

```json
{
  "stats": {
    "suites": 1,
    "tests": 4,
    "passes": 2,
    "pending": 1,
    "failures": 1,
    "start": "2019-12-22T18:44:52.229Z",
    "end": "2019-12-22T18:44:52.233Z",
    "duration": 4
  },
  "suite": {
    "title": "",
    "pending": false,
    "root": true,
    "timeout": 2000,
    "slow": 75,
    "retries": -1,
    "enableTimeouts": true,
    "tests": [
      {
        "title": "passing test in the root suite",
        "body": "function() {}",
        "timedOut": false,
        "pending": false,
        "type": "test",
        "file": "/Users/plasticrake/Code/mocha-json-serialize-reporter/test/fixtures/mocha-test-simple.fixture.js",
        "duration": 0,
        "state": "passed",
        "speed": "fast",
        "timeout": 2000,
        "slow": 75,
        "retries": -1,
        "currentRetry": 0,
        "enableTimeouts": true
      }
    ],
    "suites": [
      {
        "title": "suite one",
        "pending": false,
        "root": false,
        "file": "/Users/plasticrake/Code/mocha-json-serialize-reporter/test/fixtures/mocha-test-simple.fixture.js",
        "timeout": 2000,
        "slow": 75,
        "retries": -1,
        "enableTimeouts": true,
        "tests": [
          {
            "title": "passing test",
            "body": "function() {}",
            "timedOut": false,
            "pending": false,
            "type": "test",
            "file": "/Users/plasticrake/Code/mocha-json-serialize-reporter/test/fixtures/mocha-test-simple.fixture.js",
            "duration": 0,
            "state": "passed",
            "speed": "fast",
            "timeout": 2000,
            "slow": 75,
            "retries": -1,
            "currentRetry": 0,
            "enableTimeouts": true
          },
          {
            "title": "failing test",
            "body": "function() {\n    throw new Error('FAIL');\n  }",
            "timedOut": false,
            "pending": false,
            "type": "test",
            "file": "/Users/plasticrake/Code/mocha-json-serialize-reporter/test/fixtures/mocha-test-simple.fixture.js",
            "duration": 0,
            "state": "failed",
            "timeout": 2000,
            "slow": 75,
            "retries": -1,
            "currentRetry": 0,
            "enableTimeouts": true,
            "err": {
              "stack": "Error: FAIL\n    at Context.<anonymous> (test/fixtures/mocha-test-simple.fixture.js:7:11)\n    at processImmediate (internal/timers.js:439:21)",
              "message": "FAIL",
              "constructorName": "Error"
            }
          },
          {
            "title": "skipped test",
            "body": "function() {\n    this.skip();\n  }",
            "timedOut": false,
            "pending": true,
            "type": "test",
            "file": "/Users/plasticrake/Code/mocha-json-serialize-reporter/test/fixtures/mocha-test-simple.fixture.js",
            "duration": 0,
            "timeout": 2000,
            "slow": 75,
            "retries": -1,
            "currentRetry": 0,
            "enableTimeouts": true
          }
        ]
      }
    ]
  }
}
```

## License

[MIT](LICENSE)

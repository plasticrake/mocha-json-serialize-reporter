'use strict';

var commonjs = require('@rollup/plugin-commonjs');
var externalGlobals = require('rollup-plugin-external-globals');
var pkg = require('./package.json');

module.exports = {
  input: 'lib/json-serialize-reporter.js',
  output: {
    file: pkg.browser,
    name: 'MochaJsonSerializeReporter',
    format: 'umd',
  },
  plugins: [
    commonjs(),
    externalGlobals({
      mocha: 'Mocha',
    }),
  ],
};

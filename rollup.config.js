'use strict';

var commonjs = require('@rollup/plugin-commonjs');
var externalGlobals = require('rollup-plugin-external-globals');

module.exports = {
  input: 'lib/json-serialize-reporter.js',
  output: {
    file: './dist/mocha-json-serialize-reporter.js',
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

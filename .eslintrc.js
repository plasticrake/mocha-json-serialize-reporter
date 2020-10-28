'use strict';

module.exports = {
  env: {
    browser: false,
    commonjs: true,
    node: false,
  },
  extends: ['airbnb-base/legacy', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 5,
  },
  reportUnusedDisableDirectives: true,
  rules: {
    'func-names': ['off'],
    'vars-on-top': ['off'],
  },
};

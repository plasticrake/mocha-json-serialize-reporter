module.exports = {
  env: {
    browser: false,
    commonjs: true,
    node: false,
  },
  extends: ['airbnb-base/legacy', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 5,
    ecmaFeatures: { impliedStrict: true },
  },
  reportUnusedDisableDirectives: true,
  rules: {
    'func-names': ['off'],
    'vars-on-top': ['off'],
  },
};

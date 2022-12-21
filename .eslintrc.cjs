module.exports = {
  extends: [
    'airbnb-base',
    'airbnb-typescript/base'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
       project: './tsconfig.json'
  },
  root: true,
  rules: {
    "max-classes-per-file": ["error", 3],
    "no-console": "off",
    "max-len": ["error", 150],
  }
}
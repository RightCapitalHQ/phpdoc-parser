/** @type {import("eslint").Linter.Config} */
module.exports = {
  // usually `true` for project root config
  // see https://eslint.org/docs/latest/use/configure/configuration-files#cascading-and-hierarchy
  root: true,

  // use overrides to group different types of files
  // see https://eslint.org/docs/latest/use/configure/configuration-files#configuration-based-on-glob-patterns
  overrides: [
    {
      files: ['src/**/*.ts'],
      extends: ['@rightcapital/eslint-config-typescript'],
      env: { node: true },
    },
    {
      // test files
      files: ['tests/**/*.test.{ts,tsx}'],
      extends: ['@rightcapital/eslint-config-typescript'],
      env: { jest: true, node: true },
    },
    {
      // JavaScript config and scripts
      files: ['./**/*.{js,cjs,mjs,jsx}'],
      excludedFiles: ['src/**'],
      extends: ['@rightcapital/eslint-config-javascript'],
      env: { node: true },
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
    {
      // TypeScript config and scripts
      files: ['./**/*.{ts,cts,mts,tsx}'],
      excludedFiles: ['src/**'],
      extends: ['@rightcapital/eslint-config-typescript'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
  ],
};

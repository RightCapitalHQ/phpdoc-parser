// @ts-check
/** @type {import('beachball').BeachballConfig} */
module.exports = {
  registry: 'https://registry.npmjs.org',
  ignorePatterns: [
    '.*ignore',
    'prettier.config.cjs',
    '.eslintrc.cjs',
    'jest.*.js',
    '.pnpm-store/**',
    '.vscode/**',
    'pnpm-lock.yaml',
  ],
  changelog: {
    customRenderers: {
      renderHeader() {},
      renderChangeTypeHeader(changeType, renderInfo) {
        const changelogDate = renderInfo.newVersionChangelog.date
          .toLocaleDateString('zh-CN')
          .replace(/\//g, '-');
        const heading =
          changeType === 'major' || changeType === 'minor' ? '##' : '###';
        return `${heading} [${renderInfo.newVersionChangelog.version}](https://github.com/RightCapitalHQ/phpdoc-parser/tree/${renderInfo.newVersionChangelog.tag}) (${changelogDate})`;
      },
      // Original template: https://github.com/microsoft/beachball/blob/aefbc1ac37ee85961cc787133c827f1fd3925550/src/changelog/renderPackageChangelog.ts#L93
      renderEntry(entry) {
        if (entry.author === 'beachball') {
          return `- ${entry.comment}`;
        }
        // Imitate GitHub's commit format https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/autolinked-references-and-urls#commit-shas
        return `- ${entry.comment} ([${entry.commit.substring(
          0,
          7,
        )}](https://github.com/RightCapitalHQ/phpdoc-parser/commit/${
          entry.commit
        }))`;
      },
    },
  },
};

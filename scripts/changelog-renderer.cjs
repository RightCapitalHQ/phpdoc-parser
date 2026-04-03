const {
  default: DefaultChangelogRenderer,
} = require('nx/release/changelog-renderer');

module.exports = class ChangelogRenderer extends DefaultChangelogRenderer {
  renderVersionTitle() {
    const dateStr =
      this.changelogRenderOptions.versionTitleDate !== false
        ? ` (${new Date().toISOString().slice(0, 10)})`
        : '';
    return `## ${this.changelogEntryVersion}${dateStr}`;
  }
};

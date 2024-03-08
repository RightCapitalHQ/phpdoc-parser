# Contributing

When contributing to this repository, please first discuss the change you wish to make via issue, email, or any other method with the owners of this repository before making a change.
Please note we have a [code of conduct](CODE_OF_CONDUCT.md), please follow it in all your interactions with the project.

## Development environment setup

To set up a development environment, please follow these steps:

1. Before cloning the repo, ensure you have the following software installed.

   - `Node.js` (You should install a [version manager](https://github.com/shadowspawn/node-version-usage) that could handle .node-version file)
   - `pnpm` (You might have already installed it if you enabled the [Corepack](https://nodejs.org/api/corepack.html) feature)
   - git

2. Clone the repo

   ```sh
   git clone https://github.com/RightCapitalHQ/phpdoc-parser
   ```

3. Install the dependencies

   ```sh
   pnpm install
   ```

## Guidelines

- The code style follows the RightCapital [front-end style guide](https://github.com/RightCapitalHQ/frontend-style-guide)
- Some naming rules might be break. because for some variables or methods naming, we keep it the same as the upstream library(PHP version PHPDoc parer), It would make it easier to catch up the upstream changes.

  - eg. for the boolean variable/property name, our guide let us prefix the name with `is`, `has`, `can`, `should`, however, the upstream lib is not following this rule. so we just use the upstream's name. like `lines`, `indexes`, ``parseDescription`.
  - Our style guide requires enum types to be named in camel case. but for the enum directly from upstream lib, we just use the all caps for the member of the enum. like
    ```ts
    enum ArrayShapeNodeKind {
      ARRAY = 'array',
      LIST = 'list',
    }
    ```

## Linting and testing the code.

Please ensure your code is

1. Passing the ESLint check and Prettier check
2. Passing all existing test cases

and Your commit message is following the spec of the Conventional Commits ( https://www.conventionalcommits.org/ )

## Publishing and Changelog management

we use [beachball](https://microsoft.github.io/beachball/) to automate the npm publishing and changelog. when you fire a PR. the only thing the contributor needs to take care is ensuring run

```sh
pnpm change
```

to generate appropriate change file for us to bump the version and generate the changelog

## Issues and feature requests

You've found a bug in the source code, a mistake in the documentation or maybe you'd like a new feature? You can help us by [submitting an issue on GitHub](https://github.com/RightCapitalHQ/phpdoc-parser/issues). Before you create an issue, make sure to search the issue archive -- your issue may have already been addressed!

Please try to create bug reports that are:

- _Reproducible._ Include steps to reproduce the problem.
- _Specific._ Include as much detail as possible: which version, what environment, etc.
- _Unique._ Do not duplicate existing opened issues.
- _Scoped to a Single Bug._ One bug per report.

**Even better: Submit a pull request with a fix or new feature!**

### How to submit a Pull Request

1. Search our repository for open or closed
   [Pull Requests](https://github.com/RightCapitalHQ/phpdoc-parser/pulls)
   that relate to your submission. You don't want to duplicate effort.
2. Fork the project
3. Create your feature branch (`git checkout -b feature/amazing_feature`)
4. Commit your changes (`git commit -m 'feat: add amazing_feature'`) PHPDoc Parser uses [conventional commits](https://www.conventionalcommits.org), so please follow the specification in your commit messages.
5. Push to the branch (`git push origin feature/amazing_feature`)
6. [Open a Pull Request](https://github.com/RightCapitalHQ/phpdoc-parser/compare?expand=1)

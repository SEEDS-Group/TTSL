module.exports = {
    branches: ['main'],
    plugins: [
        ['@semantic-release/commit-analyzer', { preset: 'conventionalcommits' }],
        ['@semantic-release/release-notes-generator', { preset: 'conventionalcommits' }],
        // We don't create a changelog for the CLI, because only few changes in the repo are related to it
        ['@semantic-release/changelog', { changelogFile: 'packages/ttsl-lang/CHANGELOG.md' }],
        ['@semantic-release/changelog', { changelogFile: 'packages/ttsl-vscode/CHANGELOG.md' }],
        ['@semantic-release/npm', { pkgRoot: 'packages/ttsl-cli' }],
        ['@semantic-release/npm', { pkgRoot: 'packages/ttsl-lang' }],
        [
            '@semantic-release/exec',
            {
                prepareCmd: 'npm version ${nextRelease.version}',
                publishCmd: 'npm run package && npm run deploy',
                execCwd: 'packages/ttsl-vscode',
            },
        ],
        [
            // Update the lock file
            '@semantic-release/exec',
            {
                prepareCmd: 'npm install',
            },
        ],
        [
            '@semantic-release/github',
            {
                assets: [
                    {
                        path: 'packages/ttsl-vscode/*.vsix',
                    },
                ],
            },
        ],
        [
            '@semantic-release/git',
            {
                assets: [
                    'package-lock.json',
                    'packages/ttsl-cli/package.json',
                    'packages/ttsl-lang/CHANGELOG.md',
                    'packages/ttsl-lang/package.json',
                    'packages/ttsl-vscode/CHANGELOG.md',
                    'packages/ttsl-vscode/package.json',
                ],
            },
        ],
    ],
};

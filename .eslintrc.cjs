module.exports = {
    root: true,
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: 'tsconfig.eslint.json',
    },

    extends: '@lars-reimann',
    rules: {
        'import/extensions': 'off',
        'import/no-extraneous-dependencies': 'off',
    },
    overrides: [
        {
            files: ['packages/safe-ds-cli/src/**', 'packages/ttsl-vscode/src/extension/output.ts'],
            rules: {
                'no-console': 'off',
            },
        },
    ],
};

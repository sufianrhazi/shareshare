module.exports = {
    env: {
        browser: true,
        es2021: true,
    },
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 13,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
        },
        jxPragma: 'Gooey',
    },
    plugins: ['@typescript-eslint', 'react'],
    settings: {
        react: {
            pragma: 'Gooey',
        },
    },
    rules: {
        '@typescript-eslint/no-explicit-any': 0,
        '@typescript-eslint/no-empty-function': 0,
        '@typescript-eslint/no-unused-vars': ['warn', { args: 'none' }],
        'no-unused-vars': ['warn', { args: 'none' }],
        'react/jsx-uses-react': 2,
        '@typescript-eslint/ban-ts-comment': 0,
        '@typescript-eslint/consistent-type-imports': 'error',
    },
    overrides: [
        {
            files: ['src/**.test.*'],
            rules: {
                '@typescript-eslint/no-non-null-assertion': 0,
            },
        },
    ],
};

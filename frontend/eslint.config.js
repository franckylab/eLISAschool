/**
 * ==================================
 * eLISAschool - Configuration ESLint v9 (Flat Config)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
    // Ignorer les dossiers non pertinents
    {
        ignores: [
            'dist/**',
            'node_modules/**',
            '.tanstack/**',
            '.originkit/**',
            'public/**',
            'scripts/**',
        ],
    },

    // Configuration globale
    js.configs.recommended,

    // TypeScript + React pour tous les fichiers source
    {
        files: ['src/**/*.{ts,tsx}'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                },
                project: './tsconfig.json',
            },
            globals: {
                ...globals.browser,
                ...globals.es2021,
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
            'react': reactPlugin,
            'react-hooks': reactHooksPlugin,
        },
        rules: {
            // TypeScript
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                caughtErrorsIgnorePattern: '^_',
            }],
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/no-unsafe-function-type': 'off',
            '@typescript-eslint/no-wrapper-object-types': 'off',

            // React
            'react/jsx-no-undef': 'error',
            'react/no-unknown-property': 'off', // Tailwind classes
            'react/react-in-jsx-scope': 'off', // React 17+ JSX transform
            'react/prop-types': 'off', // TypeScript gère les types

            // React Hooks
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',

            // General
            'no-console': 'off',
            'no-debugger': 'warn',
            'prefer-const': 'warn',
            'no-var': 'error',
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },
];

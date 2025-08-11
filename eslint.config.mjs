/**********************************************************************
 * Copyright (C) 2025 Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ***********************************************************************/

import globals from 'globals';
import js from '@eslint/js';
import typescriptLint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { FlatCompat } from '@eslint/eslintrc';
import unicorn from 'eslint-plugin-unicorn';
import noNull from 'eslint-plugin-no-null';
import sonarjs from 'eslint-plugin-sonarjs';
import etc from 'eslint-plugin-etc';
import redundantUndefined from 'eslint-plugin-redundant-undefined';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import fileProgress from 'eslint-plugin-file-progress';
import vitest from '@vitest/eslint-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

const TYPESCRIPT_PROJECTS = [
  './tsconfig.json'
];


export default [
  {
    ignores: [
      '*.config.*js',
      '**/*.config.*js',
      '**/*.tests.setup.*js',
      '**/dist/**/*',
      '**/test-resources',
      '**/__mocks__/',
      '**/coverage/',
    ],
  },
  js.configs.recommended,
  ...typescriptLint.configs.recommended,
  sonarjs.configs.recommended,
  ...fixupConfigRules(
    compat.extends('plugin:import/recommended', 'plugin:import/typescript', 'plugin:etc/recommended'),
  ),
  {
    plugins: {
      // compliant v9 plug-ins
      unicorn,
      'file-progress': fileProgress,
      // non-compliant v9 plug-ins
      etc: fixupPluginRules(etc),
      import: fixupPluginRules(importPlugin),
      'no-null': fixupPluginRules(noNull),
      'redundant-undefined': fixupPluginRules(redundantUndefined),
      'simple-import-sort': fixupPluginRules(simpleImportSort),
      vitest,
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
      'file-progress/activate': {
        progress: {
          hide: false,
          successMessage: 'Lint done...',
        },
      },
    },
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
    languageOptions: {
      globals: {
        ...globals.node,
      },
      sourceType: 'module',
      parserOptions: {
        extraFileExtensions: ['.svelte'],
        warnOnUnsupportedTypeScriptVersion: false,
        project: TYPESCRIPT_PROJECTS,
      },
    },
  }
];

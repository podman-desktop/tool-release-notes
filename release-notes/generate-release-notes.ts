#!/usr/bin/env tsx

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

import { ReleaseNotesPreparator } from './release-notes-preparator';
import minimist from 'minimist';

interface Config {
  token: string;
  organization: string;
  repo: string;
  model?: string;
  milestone: string;
  port: string;
  endpoint: string;
  username: string;
  useOllama: boolean;
}

export function showHelp(): void {
  console.log('Parameters:');
  console.log('--token - GitHub token or export GITHUB_TOKEN env variable');
  console.log('--org - GitHub organization (default is "podman-desktop")');
  console.log('--repo - GitHub repository (default is "podman-desktop")');
  console.log('--username - GitHub username or export GITHUB_USERNAME env variable');
  console.log('--milestone - GitHub milestone for which we want to generate release notes e.g. 1.18.0');
  console.log('--ollama - script will try to use ollama when model is provided');
  console.log(
    '--model - name of ollama model for generating highlited PRs e.g. gemma3:27b (before running this script run "ollama run gemma3:27b")',
  );
  console.log('--port - port on which is service running');
  console.log(
    '--endpoint - endpoint of a running service, default is "/v1/chat/completions" for AI Lab and "/api/generate" for Ollama',
  );
}

function parseArguments(parsedArgs: minimist.ParsedArgs): Partial<Config> {
  const config: Partial<Config> = {
    token: process.env.GITHUB_TOKEN,
    organization: 'podman-desktop',
    repo: 'podman-desktop',
    milestone: '',
    username: process.env.GITHUB_USERNAME,
    useOllama: false,
  };

  if (parsedArgs['token']) config.token = parsedArgs.token;
  if (parsedArgs['org']) config.organization = parsedArgs.org;
  if (parsedArgs['repo']) config.repo = parsedArgs.repo;
  if (parsedArgs['model']) config.model = parsedArgs.model;
  if (parsedArgs['milestone']) config.milestone = parsedArgs.milestone;
  if (parsedArgs['port']) config.port = parsedArgs.port;
  if (parsedArgs['endpoint']) config.endpoint = parsedArgs.endpoint;
  if (parsedArgs['username']) config.username = parsedArgs.username;
  if (parsedArgs['ollama']) config.useOllama = true;

  return config;
}

function validateConfig(config: Partial<Config>): string | null {
  if (config.useOllama && !config.model) {
    return 'When using --ollama, you need to specify --model argument';
  }
  if (!config.token) {
    return 'No token found. Use either GITHUB_TOKEN or pass it as an argument';
  }
  if (!config.username) {
    return 'No username found. Use either GITHUB_USERNAME or pass it as an argument';
  }
  return null;
}

function setupDefaults(config: Partial<Config>): Config {
  if (config.useOllama) {
    config.port ??= '11434';
    config.endpoint ??= '/api/generate';
  } else {
    config.port ??= '45621';
    config.endpoint ??= '/v1/chat/completions';
  }

  return config as Config;
}

export async function run(): Promise<void> {
  const args = process.argv.slice(2);
  const parsedArgs = minimist(args);

  if (!parsedArgs) {
    showHelp();
    return;
  }

  if (parsedArgs['help']) {
    showHelp();
    return;
  }

  const partialConfig = parseArguments(parsedArgs);
  const validationError = validateConfig(partialConfig);

  if (validationError) {
    console.log(validationError);
    return;
  }

  const config = setupDefaults(partialConfig);

  const releaseNotesPreparator = new ReleaseNotesPreparator(
    config.token,
    config.organization,
    config.repo,
    config.milestone,
    config.username,
    config.model,
    config.port,
    config.endpoint,
    config.useOllama,
  );
  await releaseNotesPreparator.generate();
}

run().catch((err: unknown) => {
  console.error(err);
});

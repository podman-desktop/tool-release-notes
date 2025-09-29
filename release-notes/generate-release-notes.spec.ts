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

import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import minimist from 'minimist';

import { run } from './generate-release-notes';
import { ReleaseNotesPreparator } from './release-notes-preparator';

const consoleLogMock = vi.fn();
const consoleWarnMock = vi.fn();
const generateMock = vi.fn();

const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalProcessExit = process.exit;

let originalArgv: string[];
let originalEnv: NodeJS.ProcessEnv;

vi.mock('minimist', () => ({
  default: vi.fn(),
}));

beforeAll(() => {
  vi.mock('./release-notes-preparator', () => {
    return {
      ReleaseNotesPreparator: vi.fn(),
    };
  });
});

beforeEach(() => {
  vi.resetAllMocks();

  ReleaseNotesPreparator.prototype.generate = generateMock;
  console.log = consoleLogMock;
  console.warn = consoleWarnMock;

  originalArgv = [...process.argv];
  originalEnv = { ...process.env };

  delete process.env.GITHUB_TOKEN;
  delete process.env.GH_TOKEN;
  delete process.env.GITHUB_USERNAME;
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  (process.exit as unknown) = originalProcessExit;

  process.argv = originalArgv;
  process.env = originalEnv;
});

describe('run', () => {
  test('should parse arguments, call ReleaseNotesPreparator with correct params, and call its generate method', async () => {
    vi.mocked(minimist).mockReturnValue({
      token: 'my-cli-token',
      org: 'my-cli-org',
      repo: 'my-cli-repo',
      milestone: 'cli-1.2.3',
      username: 'my-cli-user',
      model: 'cli-gemma',
      port: 'cli-1111',
      endpoint: '/cli-gen',
      ollama: true,
    } as unknown as minimist.ParsedArgs);

    await run(); // Execute the run function

    expect(ReleaseNotesPreparator).toHaveBeenCalledTimes(1);
    expect(ReleaseNotesPreparator).toHaveBeenCalledWith(
      'my-cli-token', // token
      'my-cli-org', // organization
      'my-cli-repo', // repo
      'cli-1.2.3', // milestone
      'my-cli-user', // username
      'cli-gemma', // model
      'cli-1111', // port
      '/cli-gen', // endpoint
      true, // useOllama
    );

    expect(generateMock).toHaveBeenCalledTimes(1);
  });

  test('should use environment variables for token and username, and default ollama parameters', async () => {
    process.env.GITHUB_TOKEN = 'env-token-for-cli';
    process.env.GITHUB_USERNAME = 'env-user-for-cli';

    vi.mocked(minimist).mockReturnValue({
      token: 'env-token-for-cli',
      org: 'test-org',
      repo: 'test-repo',
      milestone: 'env-1.0.0',
      username: 'env-user-for-cli',
    } as unknown as minimist.ParsedArgs);

    await run();

    expect(ReleaseNotesPreparator).toHaveBeenCalledWith(
      'env-token-for-cli', // token from env
      'test-org', // org from args
      'test-repo', // repo from args
      'env-1.0.0', // milestone from args
      'env-user-for-cli', // username from env
      undefined, // model (default when not specified)
      '45621', // port (default for non-ollama)
      '/v1/chat/completions', // endpoint (default for non-ollama)
      false, // useOllama (default)
    );
    expect(generateMock).toHaveBeenCalled();
  });

  test('should exit if --ollama is used without --model', async () => {
    vi.mocked(minimist).mockReturnValue({
      ollama: true,
      token: 't',
      username: 'u',
      milestone: 'm',
    } as unknown as minimist.ParsedArgs);
    await run();

    expect(consoleLogMock).toHaveBeenCalledWith('When using --ollama, you need to specify --model argument');
    expect(ReleaseNotesPreparator).not.toHaveBeenCalled(); // Should not have been called
    expect(generateMock).not.toHaveBeenCalled(); // Generate should not have been called
  });

  test('should log message and not call ReleaseNotesPreparator or generate if token is missing', async () => {
    process.env.GITHUB_USERNAME = 'env-user-no-token'; // Has username but no token
    vi.mocked(minimist).mockReturnValue({
      milestone: 'no-token-1.2.3',
      username: 'env-user-no-token',
    } as unknown as minimist.ParsedArgs);

    await run();

    expect(consoleLogMock).toHaveBeenCalledWith('No token found. Use either GITHUB_TOKEN or pass it as an argument');
    expect(ReleaseNotesPreparator).not.toHaveBeenCalled();
    expect(generateMock).not.toHaveBeenCalled();
  });

  test('should handle unknown options gracefully and still proceed if required args present', async () => {
    vi.mocked(minimist).mockReturnValue({
      unknownOption: 'value',
      token: 't',
      username: 'u',
      milestone: '1.0.0',
    } as unknown as minimist.ParsedArgs);

    await run();
    expect(ReleaseNotesPreparator).toHaveBeenCalledWith(
      't',
      'podman-desktop',
      'podman-desktop',
      '1.0.0',
      'u',
      undefined,
      '45621',
      '/v1/chat/completions',
      false,
    );
    expect(generateMock).toHaveBeenCalled();
  });

  test('should show help and exit if --help is used', async () => {
    vi.mocked(minimist).mockReturnValue({
      help: true,
    } as unknown as minimist.ParsedArgs);
    await run();
    expect(consoleLogMock).toHaveBeenCalledWith(expect.stringContaining('Parameters:'));
    expect(ReleaseNotesPreparator).not.toHaveBeenCalled();
  });

  test('should show help and exit if no arguments are provided', async () => {
    vi.mocked(minimist).mockReturnValue(undefined as unknown as minimist.ParsedArgs);
    await run();
    expect(consoleLogMock).toHaveBeenCalledWith(expect.stringContaining('Parameters:'));
    expect(ReleaseNotesPreparator).not.toHaveBeenCalled();
  });
});

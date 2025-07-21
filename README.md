# Podman Desktop tool-release-notes
Tool to automate the creation of Release Notes for Podman Desktop

## Usage
- Generate release notes `pnpm generate`
- Test `pnpm test`

### Examples

1. Generate release notes using AI Lab service
```
$ export GITHUB_TOKEN=github_token_foo_bar
$ pnpm generate --username foo --milestone 1.20.0 --port 12345
```

2. Generate release notes using ollama
- For this you need to have running ollama model in this example e.g. gemma3:27b
```
$ pnpm generate --username foo --milestone 1.20.0 --model gemma3:27b --token github_token_foo_bar
```

3. Generate release notes without generating feature highlights
- Don't provide `model` and `port` argument
```
$ pnpm generate --username foo --milestone 1.20.0 --token github_token_foo_bar
```


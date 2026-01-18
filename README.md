# opencode-qwen-auth

[![npm](https://img.shields.io/npm/v/opencode-qwen-auth)](https://www.npmjs.com/package/opencode-qwen-auth)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Native [OpenCode](https://opencode.ai) plugin for Qwen authentication using Device Authorization Flow (RFC 8628).

## Features

- **Native Device Flow** — Login via Qwen's OAuth portal, no Qwen CLI needed
- **Auto-Refresh** — Automatically refreshes expired tokens in the background
- **Shared Credentials** — Uses `~/.qwen/oauth_creds.json`, compatible with Qwen CLI

## Installation

```bash
opencode plugin add opencode-qwen-auth
```

## Configuration

Add to `~/.config/opencode/config.json`:

```json
{
  "plugin": ["opencode-qwen-auth"],
  "provider": {
    "qwen": {
      "npm": "@ai-sdk/openai-compatible",
      "options": { "baseURL": "https://portal.qwen.ai/v1" },
      "models": {
        "coder-model": {
          "name": "Qwen Coder",
          "limit": { "context": 32000, "output": 8000 }
        }
      }
    }
  }
}
```

## Usage

```bash
opencode run -m qwen/coder-model "Hello!"
```

First run will prompt you to authenticate via browser.

## License

MIT

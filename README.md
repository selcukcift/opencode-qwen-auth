# opencode-qwen-auth

A native OpenCode plugin that provides seamless authentication for [Qwen](https://qwen.ai) models using the Device Authorization Flow.

## Features

- 🔐 **Native Device Flow**: Logs you in directly via Qwen's OAuth portal without needing the Qwen CLI installed.
- 🔄 **Auto-Refresh**: Automatically refreshes expired tokens in the background.
- 🤝 **Shared Credentials**: Uses the standard `~/.qwen/oauth_creds.json` file, so it shares login state with the Qwen CLI.
- ⚡ **Zero Config**: Just install and use `qwen` provider.

## Installation

```bash
# In your opencode configuration directory
opencode add opencode-qwen-auth
```

Or manually add to `opencode.json`:

```json
{
  "plugin": ["opencode-qwen-auth"],
  "provider": {
    "qwen": {
      "npm": "@ai-sdk/openai-compatible",
      "options": {
        "baseURL": "https://portal.qwen.ai/v1"
      },
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

Start OpenCode with the Qwen provider:

```bash
opencode run -m qwen/coder-model "Hello!"
```

If you are not logged in, the plugin will print a URL and Code to your terminal logs. Follow the instructions to authenticate.

## License

MIT

# Terminal AI — Cmd+K for VS Code

[![repo size](https://img.shields.io/github/repo-size/pro-gramming/terminal-extension-claude?color=blue)](https://github.com/pro-gramming/terminal-extension-claude)
[![languages](https://img.shields.io/github/languages/count/pro-gramming/terminal-extension-claude?color=blue)](https://github.com/pro-gramming/terminal-extension-claude)
[![top language](https://img.shields.io/github/languages/top/pro-gramming/terminal-extension-claude?color=blue)](https://github.com/pro-gramming/terminal-extension-claude)
[![last commit](https://img.shields.io/github/last-commit/pro-gramming/terminal-extension-claude?color=orange)](https://github.com/pro-gramming/terminal-extension-claude/commits/main)

---

**[How It Works](#how-it-works)** · **[Requirements](#requirements)** · **[Installation](#installation)** · **[Configuration](#configuration)** · **[Development](#development)** · **[Security](#security-notes)** · **[License](#license)**

---

Bring Cursor's Cmd+K terminal experience to VS Code. Press **Cmd+K** (macOS) or **Ctrl+K** (Linux) while the integrated terminal has focus, describe what you want to do in plain English, and the extension generates the right shell command and types it into the terminal — without running it — so you stay in control.

## How It Works

1. Focus the integrated terminal and press **Cmd+K** / **Ctrl+K**
2. Type a natural language instruction (e.g. *"list all files sorted by size"*)
3. Press **Enter** — the extension calls Claude and injects the generated command into the terminal
4. Review the command, then press **Enter** in the terminal to run it (or **Ctrl+C** to discard)

## Requirements

- [Claude Code CLI](https://claude.ai/code) installed and authenticated (`claude --version` should work)
- macOS or Linux (Windows not currently supported)

## Installation

### Option A — Download VSIX (recommended)

1. Go to the [Releases page](https://github.com/pro-gramming/terminal-extension-claude/releases)
2. Download the latest `terminal-ai-*.vsix` file
3. In VS Code: open the **Extensions** panel → click `···` → **Install from VSIX…**
4. Select the downloaded file

Or install directly from the terminal:
```bash
code --install-extension terminal-ai-<version>.vsix
```

### Option B — Build from source

```bash
git clone https://github.com/pro-gramming/terminal-extension-claude.git
cd terminal-extension-claude
npm install
npm run package        # produces terminal-ai-*.vsix
code --install-extension terminal-ai-*.vsix
```

## Configuration

All settings are under `terminalAI` in VS Code settings (`Cmd+,`):

| Setting | Default | Description |
|---|---|---|
| `terminalAI.claudePath` | `"claude"` | Path to the Claude Code CLI binary, if not on PATH |
| `terminalAI.systemPrompt` | *(built-in)* | Override the system prompt sent to Claude |
| `terminalAI.timeoutSeconds` | `30` | Max seconds to wait for Claude before timing out |

## Development

```bash
npm run compile     # Build TypeScript → out/
npm run watch       # Rebuild on save
npm run lint        # ESLint
npm run test:unit   # Run unit tests
npm run package     # Build .vsix
```

Press **F5** in VS Code to launch the Extension Development Host for manual testing.

## Security Notes

- **Non-destructive injection**: commands are typed into the terminal but never auto-executed. You always press Enter yourself.
- **Multi-line protection**: if Claude returns multiple lines, only the first is used to prevent accidental execution via embedded newlines.
- **Prompt injection mitigation**: user input is separated from the system prompt by an explicit delimiter and marked as untrusted in every request.
- **No embedded credentials**: the extension delegates entirely to the locally installed `claude` CLI.

## License

[MIT](./LICENSE.md) — free to use, modify, and distribute.

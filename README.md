# Terminal AI — Cmd+K for VS Code

Bring Cursor's Cmd+K terminal experience to VS Code. Press **Cmd+K** (macOS) or **Ctrl+K** (Windows/Linux) while the integrated terminal has focus, describe what you want to do in plain English, and the extension generates the right shell command and types it into the terminal — without running it — so you stay in control.

## How It Works

1. Focus the integrated terminal and press **Cmd+K** / **Ctrl+K**
2. Type a natural language instruction (e.g. *"list all files sorted by size"*)
3. Press **Enter** — the extension calls Claude and injects the generated command into the terminal
4. Review the command, then press **Enter** in the terminal to run it (or **Ctrl+C** to discard)

## Requirements

- [Claude Code CLI](https://claude.ai/code) installed and authenticated (`claude --version` should work)
- macOS or Linux (Windows is not currently supported)

## Installation

1. Clone this repo and open it in VS Code
2. Run `npm install`
3. Press **F5** to launch the Extension Development Host

## Configuration

All settings are under `terminalAI` in VS Code settings:

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
```

Press **F5** in VS Code to launch the Extension Development Host for manual testing.

## Security Notes

- **Non-destructive injection**: commands are typed into the terminal but never auto-executed. You always press Enter yourself.
- **Multi-line protection**: if Claude returns multiple lines, only the first is used to prevent accidental execution via embedded newlines.
- **Prompt injection mitigation**: user input is separated from the system prompt by an explicit delimiter and marked as untrusted in every request.
- **No embedded credentials**: the extension delegates entirely to the locally installed `claude` CLI.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A VS Code extension that replicates Cursor's Cmd+K terminal experience. When the integrated terminal has focus, pressing Cmd+K (macOS) / Ctrl+K (Windows/Linux) opens a floating input panel. The user types a natural language instruction; the extension calls the `claude` CLI to generate an OS-aware shell command, then injects it into the terminal **without executing it** so the user can review first.

## Commands

```bash
npm run compile    # Compile TypeScript → out/
npm run watch      # Watch mode
```

To run/debug the extension: open the repo in VS Code and press **F5** (launches an Extension Development Host).

## Architecture

```
src/
├── extension.ts        # activate(): registers terminalAI.invoke command, wires everything together
├── inputPanel.ts       # Webview panel (floating HTML input); returns Promise<string|undefined>
├── aiService.ts        # Shells out to `claude -p "..."` CLI; returns the generated command string
├── osDetector.ts       # Reads process.platform + vscode.env.shell → OsInfo
├── terminalInjector.ts # terminal.sendText(command, false) — non-destructive injection
└── types.ts            # Shared: OsInfo interface
```

**Data flow:**
`Cmd+K` → `extension.ts` → `inputPanel` (user types) → `osDetector` → `aiService` (claude CLI) → `terminalInjector`

## Key Design Details

- **AI backend**: `aiService.ts` calls the `claude` CLI via `child_process.exec`. The `claude` binary must be installed and authenticated on the user's machine. No API key is embedded in the extension.
- **Non-destructive injection**: `terminal.sendText(cmd, false)` — the `false` argument prevents appending a newline, so the command is typed but not run.
- **Keybinding scope**: `"when": "terminalFocus"` ensures Cmd+K only intercepts inside the terminal, not the editor.
- **Webview input**: The panel uses VS Code CSS variables (`--vscode-input-background`, etc.) to match the active theme automatically.

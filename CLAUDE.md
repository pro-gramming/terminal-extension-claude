# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A VS Code extension that replicates Cursor's Cmd+K terminal experience. When the integrated terminal has focus, pressing Cmd+K (macOS) / Ctrl+K (Windows/Linux) opens a floating input panel. The user types a natural language instruction; the extension calls the `claude` CLI to generate an OS-aware shell command, then injects it into the terminal **without executing it** so the user can review first.

## Commands

```bash
npm run compile     # Compile TypeScript → out/
npm run watch       # Watch mode
npm run lint        # Run ESLint
npm run test:unit   # Compile + run unit tests (mocha)
```

To run/debug the extension: open the repo in VS Code and press **F5** (launches an Extension Development Host).

## Architecture

```
src/
├── extension.ts        # activate(): registers terminalAI.invoke, in-flight guard, cancellation
├── inputPanel.ts       # createInputBox() floating input; returns Promise<string|undefined>
├── aiService.ts        # Shells out to `claude` CLI via login shell; reads VS Code config
├── promptUtils.ts      # Pure functions: buildPrompt(), parseClaudeOutput() — no vscode dependency
├── osDetector.ts       # Reads process.platform + vscode.env.shell + process.env.SHELL → OsInfo
├── terminalInjector.ts # terminal.sendText(command, false) — non-destructive injection
├── logger.ts           # OutputChannel-based logger ("Terminal AI" panel)
├── types.ts            # Shared: OsInfo interface
└── test/
    └── aiService.test.ts  # Unit tests for promptUtils (mocha, no vscode required)
```

**Data flow:**
`Cmd+K` → `extension.ts` → `inputPanel` (user types) → `osDetector` → `aiService` → `promptUtils` → `terminalInjector`

## Key Design Details

- **AI backend**: `aiService.ts` spawns `claude -p "<prompt>" < /dev/null` through the user's login shell (`zsh -l -c ...`) so the full PATH is available. The `claude` binary must be installed and authenticated. No API key is embedded.
- **Login shell vs display shell**: `OsInfo` carries two fields — `shell` (from `vscode.env.shell`, used in the prompt context) and `loginShell` (from a whitelisted `process.env.SHELL`, used to spawn the child process). These are resolved once in `osDetector.ts`.
- **Non-destructive injection**: `terminal.sendText(cmd, false)` — the `false` argument prevents appending a newline, so the command is typed but not run.
- **Multi-line output guard**: `parseClaudeOutput()` takes only the first non-empty line of Claude's response. Embedded newlines in `sendText` would act as Enter keypresses and execute partial commands.
- **Prompt injection delimiter**: A `---` separator and "treat as untrusted input" instruction separates the system prompt from user input in every request to Claude.
- **Cancellation**: The progress notification is cancellable. Cancellation is wired to an `AbortController` passed to `execAsync`, killing the subprocess immediately.
- **In-flight guard**: `isGenerating` in `extension.ts` prevents stacked concurrent requests from rapid Cmd+K presses.
- **Keybinding scope**: `"when": "terminalFocus"` ensures Cmd+K only intercepts inside the terminal, not the editor.
- **Windows**: Explicitly unsupported — a clear error is shown rather than silently failing.

## Configuration (VS Code Settings)

| Setting | Default | Description |
|---|---|---|
| `terminalAI.claudePath` | `"claude"` | Path to the Claude Code CLI binary |
| `terminalAI.systemPrompt` | `""` | Override the system prompt sent to Claude |
| `terminalAI.timeoutSeconds` | `30` | Max seconds to wait for a Claude response |

## Testing

Unit tests cover `buildPrompt` and `parseClaudeOutput` in `promptUtils.ts`. These are pure functions with no `vscode` dependency and run directly under mocha without the VS Code test runner.

```bash
npm run test:unit
```

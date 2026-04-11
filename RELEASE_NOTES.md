## Added
- **Terminal Context Awareness** — recent commands and current working directory are included in the prompt, so Claude generates commands relevant to where you actually are
- **Command History** — last few terminal executions are passed as context, improving accuracy for follow-up instructions
- **Multi-line File Creation via Heredoc** — Claude can now generate full heredoc blocks (`cat <<EOF ... EOF`) that are injected as a single unit without accidental execution
- **Long Command Continuation** — commands spanning multiple lines with `\` are kept intact instead of being truncated to the first line

## Changed
- `parseClaudeOutput` now preserves multi-line output for heredocs and `\`-continued commands; single-line guard still applies to everything else
- `buildPrompt` accepts optional terminal context and injects it between the OS info and the user instruction

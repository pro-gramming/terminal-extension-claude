import * as vscode from 'vscode';

/**
 * Injects a command into the given terminal without executing it.
 * The user must press Enter themselves to run the command.
 */
export function injectCommand(terminal: vscode.Terminal, command: string): void {
  // sendText with addNewLine=false inserts text without pressing Enter
  terminal.sendText(command, false);
  terminal.show(true);
}

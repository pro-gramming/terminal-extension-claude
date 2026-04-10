import * as vscode from 'vscode';
import { showInputPanel } from './inputPanel';
import { generateCommand } from './aiService';
import { detectOsInfo } from './osDetector';
import { injectCommand } from './terminalInjector';

export function activate(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand('terminalAI.invoke', async () => {
    const terminal = vscode.window.activeTerminal;
    if (!terminal) {
      vscode.window.showWarningMessage('Terminal AI: No active terminal found.');
      return;
    }

    const instruction = await showInputPanel(context);
    if (!instruction) {
      return;
    }

    const osInfo = detectOsInfo();

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Terminal AI: Generating command…',
        cancellable: false,
      },
      async () => {
        try {
          const command = await generateCommand(instruction, osInfo);
          injectCommand(terminal, command);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`Terminal AI: ${message}`);
        }
      }
    );
  });

  context.subscriptions.push(disposable);
}

export function deactivate(): void {}

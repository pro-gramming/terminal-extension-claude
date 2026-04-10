import * as vscode from 'vscode';
import { showInputPanel } from './inputPanel';
import { generateCommand } from './aiService';
import { detectOsInfo } from './osDetector';
import { injectCommand } from './terminalInjector';
import { initLogger, logger } from './logger';

export function activate(context: vscode.ExtensionContext): void {
  initLogger(context);
  logger.info('Terminal AI activated');

  let isGenerating = false;

  const disposable = vscode.commands.registerCommand('terminalAI.invoke', async () => {
    if (isGenerating) {
      vscode.window.showInformationMessage('Terminal AI: Already generating a command, please wait.');
      return;
    }

    logger.info('terminalAI.invoke triggered');

    if (process.platform === 'win32') {
      vscode.window.showErrorMessage(
        'Terminal AI: Windows is not currently supported. Please use WSL or a POSIX-compatible shell.',
      );
      return;
    }

    const terminal = vscode.window.activeTerminal;
    if (!terminal) {
      logger.error('No active terminal found');
      vscode.window.showWarningMessage('Terminal AI: No active terminal found.');
      return;
    }

    logger.info(`Active terminal: "${terminal.name}"`);

    const instruction = await showInputPanel();
    if (!instruction) {
      logger.info('User cancelled input');
      return;
    }

    logger.info(`User provided instruction (${instruction.length} chars)`);

    const osInfo = detectOsInfo();
    logger.info(`OS info — platform: ${osInfo.platform}, shell: ${osInfo.shell}, loginShell: ${osInfo.loginShell}`);

    isGenerating = true;

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Terminal AI: Generating command…',
        cancellable: true,
      },
      async (_, token) => {
        const controller = new AbortController();
        token.onCancellationRequested(() => {
          logger.info('User cancelled command generation');
          controller.abort();
        });

        try {
          const command = await generateCommand(instruction, osInfo, controller.signal);
          logger.info(`Injecting command into terminal "${terminal.name}"`);
          injectCommand(terminal, command);
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            return;
          }
          logger.error('Failed to generate command', err);
          logger.show();
          const message = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`Terminal AI: ${message}`);
        } finally {
          isGenerating = false;
        }
      },
    );
  });

  context.subscriptions.push(disposable);
}

export function deactivate(): void {
  logger.info('Terminal AI deactivated');
}

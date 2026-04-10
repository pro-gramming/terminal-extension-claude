import * as vscode from 'vscode';
import { showInputPanel } from './inputPanel';
import { generateCommand } from './aiService';
import { detectOsInfo } from './osDetector';
import { injectCommand } from './terminalInjector';
import { initLogger, logger } from './logger';

export function activate(context: vscode.ExtensionContext): void {
  initLogger(context);
  logger.info('Terminal AI activated');

  const disposable = vscode.commands.registerCommand('terminalAI.invoke', async () => {
    logger.info('terminalAI.invoke triggered');

    const terminal = vscode.window.activeTerminal;
    if (!terminal) {
      logger.error('No active terminal found');
      vscode.window.showWarningMessage('Terminal AI: No active terminal found.');
      return;
    }

    logger.info(`Active terminal: "${terminal.name}"`);

    const instruction = await showInputPanel(context);
    if (!instruction) {
      logger.info('User cancelled input');
      return;
    }

    logger.info(`User instruction: "${instruction}"`);

    const osInfo = detectOsInfo();
    logger.info(`OS info — platform: ${osInfo.platform}, shell: ${osInfo.shell}`);

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Terminal AI: Generating command…',
        cancellable: false,
      },
      async () => {
        try {
          const command = await generateCommand(instruction, osInfo);
          logger.info(`Injecting command into terminal: ${command}`);
          injectCommand(terminal, command);
        } catch (err) {
          logger.error('Failed to generate command', err);
          logger.show();
          const message = err instanceof Error ? err.message : String(err);
          vscode.window.showErrorMessage(`Terminal AI: ${message}`);
        }
      }
    );
  });

  context.subscriptions.push(disposable);
}

export function deactivate(): void {
  logger.info('Terminal AI deactivated');
}

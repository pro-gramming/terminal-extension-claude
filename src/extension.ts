import * as vscode from 'vscode';
import { showInputPanel } from './inputPanel';
import { generateCommand } from './aiService';
import { detectOsInfo } from './osDetector';
import { injectCommand } from './terminalInjector';
import { initLogger, logger } from './logger';
import { buildTerminalContext } from './promptUtils';
import { TerminalExecution } from './types';

export function activate(context: vscode.ExtensionContext): void {
  initLogger(context);
  logger.info('Terminal AI activated');

  // Terminal history: recent command+output pairs per terminal (VS Code 1.93+)
  const terminalHistory = new Map<vscode.Terminal, TerminalExecution[]>();

  if (vscode.window.onDidStartTerminalShellExecution) {
    context.subscriptions.push(
      vscode.window.onDidStartTerminalShellExecution((event) => {
        const cmd = event.execution.commandLine.value.trim();
        if (!cmd) { return; }
        void (async () => {
          const chunks: string[] = [];
          for await (const chunk of event.execution.read()) {
            chunks.push(chunk);
          }
          const output = chunks.join('').trim().slice(0, 2000);
          const list = terminalHistory.get(event.terminal) ?? [];
          list.push({ command: cmd, output });
          if (list.length > 10) { list.shift(); }
          terminalHistory.set(event.terminal, list);
        })();
      }),
    );
    context.subscriptions.push(
      vscode.window.onDidCloseTerminal(t => terminalHistory.delete(t)),
    );
  }

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

    // Load history and show input panel
    const history = context.globalState.get<string[]>('terminalAI.history', []);
    const instruction = await showInputPanel(history);
    if (!instruction) {
      logger.info('User cancelled input');
      return;
    }

    logger.info(`User provided instruction (${instruction.length} chars)`);

    // Persist history: deduplicated, newest first, capped at 50
    const updatedHistory = [instruction, ...history.filter(h => h !== instruction)].slice(0, 50);
    void context.globalState.update('terminalAI.history', updatedHistory);

    const osInfo = detectOsInfo();
    logger.info(`OS info — platform: ${osInfo.platform}, shell: ${osInfo.shell}, loginShell: ${osInfo.loginShell}`);

    // Build terminal context from recent executions
    const recentExecs = terminalHistory.get(terminal) ?? [];
    const cwd = terminal.shellIntegration?.cwd?.fsPath;
    const terminalContext = buildTerminalContext(recentExecs, cwd);
    if (terminalContext) {
      logger.info(`Terminal context: ${recentExecs.length} recent command(s), cwd: ${cwd ?? 'unknown'}`);
    }

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
          const command = await generateCommand(instruction, osInfo, terminalContext, controller.signal);
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

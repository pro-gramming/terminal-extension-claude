import * as vscode from 'vscode';

let channel: vscode.OutputChannel | undefined;

export function initLogger(context: vscode.ExtensionContext): void {
  channel = vscode.window.createOutputChannel('Terminal AI');
  context.subscriptions.push(channel);
}

export const logger = {
  info(message: string): void {
    log('INFO', message);
  },
  warn(message: string): void {
    log('WARN', message);
  },
  error(message: string, err?: unknown): void {
    const detail = err instanceof Error ? `${err.message}\n${err.stack ?? ''}` : String(err ?? '');
    log('ERROR', detail ? `${message} — ${detail}` : message);
  },
  show(): void {
    channel?.show(true);
  },
};

function log(level: string, message: string): void {
  if (!channel) {
    // Logger used before initLogger() was called — surface in developer console so it's never silent
    console.warn(`[TerminalAI] Logger not initialised — dropping: [${level}] ${message}`);
    return;
  }
  channel.appendLine(`[${new Date().toISOString()}] [${level}] ${message}`);
}

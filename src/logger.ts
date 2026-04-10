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
  const timestamp = new Date().toISOString();
  channel?.appendLine(`[${timestamp}] [${level}] ${message}`);
}

import * as vscode from 'vscode';
import { OsInfo } from './types';

export function detectOsInfo(): OsInfo {
  return {
    platform: process.platform,
    shell: vscode.env.shell || defaultShell(),
  };
}

function defaultShell(): string {
  switch (process.platform) {
    case 'win32':
      return 'cmd.exe';
    case 'darwin':
      return '/bin/zsh';
    default:
      return '/bin/bash';
  }
}

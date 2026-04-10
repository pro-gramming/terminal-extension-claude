import * as vscode from 'vscode';
import { OsInfo } from './types';

const ALLOWED_LOGIN_SHELLS = [
  '/bin/zsh', '/bin/bash', '/bin/sh',
  '/usr/bin/zsh', '/usr/bin/bash', '/usr/bin/sh',
  '/usr/local/bin/zsh', '/usr/local/bin/bash',
];

export function detectOsInfo(): OsInfo {
  return {
    platform: process.platform,
    shell: vscode.env.shell || defaultShell(),
    loginShell: resolveLoginShell(),
  };
}

function resolveLoginShell(): string {
  const envShell = process.env.SHELL ?? '';
  if (ALLOWED_LOGIN_SHELLS.includes(envShell)) {
    return envShell;
  }
  return process.platform === 'darwin' ? '/bin/zsh' : '/bin/bash';
}

function defaultShell(): string {
  switch (process.platform) {
    case 'win32':  return 'cmd.exe';
    case 'darwin': return '/bin/zsh';
    default:       return '/bin/bash';
  }
}

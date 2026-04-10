export interface OsInfo {
  platform: NodeJS.Platform;
  shell: string;       // vscode.env.shell — used in prompt context
  loginShell: string;  // process.env.SHELL — used to spawn child processes
}

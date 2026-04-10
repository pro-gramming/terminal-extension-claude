import * as vscode from 'vscode';

/**
 * Shows a floating command-palette-style input box.
 * Resolves with the user's instruction, or undefined if dismissed.
 */
export function showInputPanel(): Promise<string | undefined> {
  return new Promise((resolve) => {
    const inputBox = vscode.window.createInputBox();

    inputBox.title = 'Terminal AI';
    inputBox.placeholder = 'e.g. list all files sorted by size';
    inputBox.prompt = 'Describe what you want to do';
    inputBox.ignoreFocusOut = true;

    let accepted = false;

    inputBox.onDidAccept(() => {
      accepted = true;
      const value = inputBox.value.trim();
      inputBox.hide();
      resolve(value || undefined);
    });

    inputBox.onDidHide(() => {
      inputBox.dispose();
      if (!accepted) {
        resolve(undefined);
      }
    });

    inputBox.show();
  });
}

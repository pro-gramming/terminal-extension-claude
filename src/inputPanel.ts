import * as vscode from 'vscode';

/**
 * Shows a floating command-palette-style input with history navigation.
 * History items appear below the input; arrow keys navigate, Enter selects.
 * Resolves with the user's instruction, or undefined if dismissed.
 */
export function showInputPanel(history: string[]): Promise<string | undefined> {
  return new Promise((resolve) => {
    const qp = vscode.window.createQuickPick<vscode.QuickPickItem>();

    qp.title = 'Terminal AI';
    qp.placeholder = 'Describe what you want to do (↑↓ for history)';
    qp.ignoreFocusOut = true;
    qp.matchOnDescription = false;
    qp.matchOnDetail = false;
    qp.items = history.map(h => ({ label: h }));

    let accepted = false;

    qp.onDidAccept(() => {
      accepted = true;
      const value = qp.selectedItems[0]?.label ?? qp.value.trim();
      qp.hide();
      resolve(value || undefined);
    });

    qp.onDidHide(() => {
      qp.dispose();
      if (!accepted) {
        resolve(undefined);
      }
    });

    qp.show();
  });
}

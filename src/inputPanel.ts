import * as vscode from 'vscode';

/**
 * Shows a floating webview panel with a text input.
 * Resolves with the user's instruction, or undefined if dismissed.
 */
export function showInputPanel(context: vscode.ExtensionContext): Promise<string | undefined> {
  return new Promise((resolve) => {
    const panel = vscode.window.createWebviewPanel(
      'terminalAI',
      'Terminal AI',
      {
        viewColumn: vscode.ViewColumn.Active,
        preserveFocus: false,
      },
      {
        enableScripts: true,
        retainContextWhenHidden: false,
      }
    );

    panel.webview.html = getWebviewContent();

    let resolved = false;

    panel.webview.onDidReceiveMessage(
      (message: { type: string; text?: string }) => {
        if (message.type === 'submit' && message.text !== undefined) {
          resolved = true;
          panel.dispose();
          resolve(message.text.trim() || undefined);
        } else if (message.type === 'cancel') {
          resolved = true;
          panel.dispose();
          resolve(undefined);
        }
      },
      undefined,
      context.subscriptions
    );

    panel.onDidDispose(() => {
      if (!resolved) {
        resolve(undefined);
      }
    });
  });
}

function getWebviewContent(): string {
  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Terminal AI</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: transparent;
      font-family: var(--vscode-font-family, sans-serif);
    }

    .container {
      width: 100%;
      max-width: 640px;
      padding: 0 16px;
    }

    .label {
      font-size: 11px;
      color: var(--vscode-descriptionForeground, #888);
      margin-bottom: 6px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .input-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    input {
      flex: 1;
      padding: 8px 12px;
      font-size: 14px;
      border: 1px solid var(--vscode-focusBorder, #007acc);
      border-radius: 4px;
      background: var(--vscode-input-background, #1e1e1e);
      color: var(--vscode-input-foreground, #d4d4d4);
      outline: none;
    }

    input::placeholder {
      color: var(--vscode-input-placeholderForeground, #888);
    }

    button {
      padding: 8px 14px;
      font-size: 13px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      background: var(--vscode-button-background, #007acc);
      color: var(--vscode-button-foreground, #fff);
    }

    button:hover {
      background: var(--vscode-button-hoverBackground, #005fa3);
    }

    .hint {
      font-size: 11px;
      color: var(--vscode-descriptionForeground, #888);
      margin-top: 6px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="label">Terminal AI — describe what you want to do</div>
    <div class="input-row">
      <input
        id="instruction"
        type="text"
        placeholder="e.g. list all files sorted by size"
        autofocus
      />
      <button id="submitBtn">Generate</button>
    </div>
    <div class="hint">Press Enter to generate · Escape to cancel</div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const input = document.getElementById('instruction');
    const submitBtn = document.getElementById('submitBtn');

    window.addEventListener('load', () => input.focus());

    function submit() {
      const text = input.value;
      vscode.postMessage({ type: 'submit', text });
    }

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { submit(); }
      if (e.key === 'Escape') { vscode.postMessage({ type: 'cancel' }); }
    });

    submitBtn.addEventListener('click', submit);
  </script>
</body>
</html>`;
}

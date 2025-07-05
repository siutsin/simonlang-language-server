// extension.js
import { workspace } from 'vscode';
import { LanguageClient, TransportKind } from 'vscode-languageclient/node.js';

function activate(context) {
  console.log('Extension activating');

  // Register your language with VSCode here
  const serverModule = context.asAbsolutePath('./server/server.js');
  const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

  const serverOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions },
  };

  const clientOptions = {
    documentSelector: [{ scheme: 'file', language: 'simonlang' }],
    synchronize: {
      configurationSection: 'simonlangLanguageServer',
      fileEvents: [
        workspace.createFileSystemWatcher('**/*.simon'),
      ],
    },
  };

  console.log(`Server module path: ${serverModule}`);

  const client = new LanguageClient(
    'simonlang',
    'simon language server',
    serverOptions,
    clientOptions
  );

  const disposable = client.start();
  context.subscriptions.push(disposable);

  console.log('Language client started');
}

function deactivate() {}

export { activate, deactivate };

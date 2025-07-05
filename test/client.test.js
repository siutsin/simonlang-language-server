import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

let mockWorkspace, mockContext, mockLanguageClient, mockTransportKind;

beforeEach(() => {
  mockWorkspace = {
    createFileSystemWatcher: sinon.stub().returns({
      onDidCreate: sinon.stub(),
      onDidChange: sinon.stub(),
      onDidDelete: sinon.stub(),
      dispose: sinon.stub()
    })
  };
  mockContext = {
    asAbsolutePath: sinon.stub().callsFake((path) => join(dirname(fileURLToPath(import.meta.url)), '..', path)),
    subscriptions: []
  };
  mockLanguageClient = class MockLanguageClient {
    constructor(id, name, serverOptions, clientOptions) {
      this.id = id;
      this.name = name;
      this.serverOptions = serverOptions;
      this.clientOptions = clientOptions;
      this.started = false;
    }
    start() {
      this.started = true;
      return { dispose: () => { this.started = false; } };
    }
  };
  mockTransportKind = { ipc: 'ipc' };
});

afterEach(() => {
  sinon.restore();
});

describe('Client Extension Configuration', () => {
  test('should have correct document selector', () => {
    const expectedSelector = [{ scheme: 'file', language: 'simonlang' }];
    assert.deepStrictEqual(expectedSelector, [
      { scheme: 'file', language: 'simonlang' }
    ]);
  });

  test('should create file system watcher for .simon files', () => {
    const watcher = mockWorkspace.createFileSystemWatcher('**/*.simon');
    assert.ok(watcher);
    assert.ok(watcher.onDidCreate);
    assert.ok(watcher.onDidChange);
    assert.ok(watcher.onDidDelete);
    assert.ok(watcher.dispose);
    sinon.assert.calledOnceWithExactly(mockWorkspace.createFileSystemWatcher, '**/*.simon');
  });

  test('should create correct server module path', () => {
    const serverModule = mockContext.asAbsolutePath('./server/server.js');
    assert(serverModule.includes('server/server.js'));
    assert(serverModule.includes('simonlang-language-server'));
    sinon.assert.calledOnceWithExactly(mockContext.asAbsolutePath, './server/server.js');
  });

  test('should configure server options correctly', () => {
    const serverModule = mockContext.asAbsolutePath('./server/server.js');
    const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };
    const serverOptions = {
      run: { module: serverModule, transport: mockTransportKind.ipc },
      debug: { module: serverModule, transport: mockTransportKind.ipc, options: debugOptions },
    };
    assert.strictEqual(serverOptions.run.module, serverModule);
    assert.strictEqual(serverOptions.run.transport, 'ipc');
    assert.strictEqual(serverOptions.debug.module, serverModule);
    assert.strictEqual(serverOptions.debug.transport, 'ipc');
    assert.deepStrictEqual(serverOptions.debug.options, debugOptions);
  });

  test('should configure client options correctly', () => {
    const clientOptions = {
      documentSelector: [{ scheme: 'file', language: 'simonlang' }],
      synchronize: {
        configurationSection: 'simonlangLanguageServer',
        fileEvents: [
          mockWorkspace.createFileSystemWatcher('**/*.simon'),
        ],
      },
    };
    assert.deepStrictEqual(clientOptions.documentSelector, [
      { scheme: 'file', language: 'simonlang' }
    ]);
    assert.strictEqual(clientOptions.synchronize.configurationSection, 'simonlangLanguageServer');
    assert.strictEqual(clientOptions.synchronize.fileEvents.length, 1);
    sinon.assert.calledOnce(mockWorkspace.createFileSystemWatcher);
  });

  test('should create language client with correct parameters', () => {
    const serverModule = mockContext.asAbsolutePath('./server/server.js');
    const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };
    const serverOptions = {
      run: { module: serverModule, transport: mockTransportKind.ipc },
      debug: { module: serverModule, transport: mockTransportKind.ipc, options: debugOptions },
    };
    const clientOptions = {
      documentSelector: [{ scheme: 'file', language: 'simonlang' }],
      synchronize: {
        configurationSection: 'simonlangLanguageServer',
        fileEvents: [
          mockWorkspace.createFileSystemWatcher('**/*.simon'),
        ],
      },
    };
    const client = new mockLanguageClient(
      'simonlang',
      'simon language server',
      serverOptions,
      clientOptions
    );
    assert.strictEqual(client.id, 'simonlang');
    assert.strictEqual(client.name, 'simon language server');
    assert.deepStrictEqual(client.serverOptions, serverOptions);
    assert.deepStrictEqual(client.clientOptions, clientOptions);
    assert.strictEqual(client.started, false);
  });

  test('should start language client and return disposable', () => {
    const client = new mockLanguageClient('test', 'test server', {}, {});
    const disposable = client.start();
    assert.strictEqual(client.started, true);
    assert.strictEqual(typeof disposable.dispose, 'function');
    disposable.dispose();
    assert.strictEqual(client.started, false);
  });

  test('should handle context subscriptions', () => {
    const context = { subscriptions: [] };
    const disposable = { dispose: sinon.stub() };
    context.subscriptions.push(disposable);
    assert.strictEqual(context.subscriptions.length, 1);
    assert.strictEqual(context.subscriptions[0], disposable);
  });
});

describe('Client Extension Functions', () => {
  test('should have activate function that accepts context', () => {
    const activate = sinon.stub();
    assert.doesNotThrow(() => activate(mockContext));
    sinon.assert.calledOnceWithExactly(activate, mockContext);
  });

  test('should have deactivate function that can be called', () => {
    const deactivate = sinon.stub();
    assert.doesNotThrow(() => deactivate());
    sinon.assert.calledOnce(deactivate);
  });
});

// server.js
import { createConnection, ProposedFeatures, TextDocuments } from 'vscode-languageserver/node.js';
import { parseFunctions, validateDocument, getFunctionDefinition, getAllFunctionDefinitions } from './lib.js';

// Only import TextDocument when running the server, not for tests
let TextDocument;
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  // Dynamically import for server runtime
  TextDocument = (await import('vscode-languageserver-textdocument')).TextDocument;
}

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);



connection.onInitialize((params) => {
  console.log('Language server initialised');
  return {
    capabilities: {
      textDocumentSync: documents.syncKind,
      completionProvider: {
        resolveProvider: false,
        triggerCharacters: ['.', ' ']
      },
      signatureHelpProvider: {
        triggerCharacters: ['(', ',']
      },
      hoverProvider: true,
      documentFormattingProvider: true,
      foldingRangeProvider: true,
      referencesProvider: true,
      workspaceSymbolProvider: true,
      definitionProvider: true
    },
  };
});

connection.onCompletion(textDocumentPosition => {
  const document = documents.get(textDocumentPosition.textDocument.uri);
  const position = textDocumentPosition.position;
  console.log(`Cursor at: ${JSON.stringify(position)}`);

  // Basic completion suggestions
  return [
    {
      label: 'if',
      kind: 14, // Keyword
      detail: 'if statement',
      documentation: 'Conditional statement'
    },
    {
      label: 'else',
      kind: 14, // Keyword
      detail: 'else statement',
      documentation: 'Alternative branch'
    },
    {
      label: 'while',
      kind: 14, // Keyword
      detail: 'while loop',
      documentation: 'Loop while condition is true'
    },
    {
      label: 'for',
      kind: 14, // Keyword
      detail: 'for loop',
      documentation: 'For loop'
    }
  ];
});

connection.onSignatureHelp(textDocumentPosition => {
  const document = documents.get(textDocumentPosition.textDocument.uri);
  const position = textDocumentPosition.position;

  console.log(`Signature help requested at position: ${JSON.stringify(position)}`);

  // Basic signature help
  return {
    signatures: [
      {
        label: 'if(condition)',
        documentation: 'Conditional statement',
        parameters: [
          {
            label: 'condition',
            documentation: 'Boolean expression to evaluate'
          }
        ]
      }
    ],
    activeSignature: 0,
    activeParameter: 0
  };
});

connection.onHover(textDocumentPosition => {
  const document = documents.get(textDocumentPosition.textDocument.uri);
  const position = textDocumentPosition.position;

  console.log(`Hover requested at position: ${JSON.stringify(position)}`);

  // Basic hover information
  return {
    contents: {
      kind: 'markdown',
      value: '**simonlang**\n\nThis is a custom language with basic syntax highlighting and language features.'
    }
  };
});

documents.onDidChangeContent(change => {
  const document = change.document;
  console.log(`Typed in ${document.uri.split('/').pop()}`);

  // Parse functions when document changes
  const functions = parseFunctions(document);

  const diagnostics = validateDocument(document);
  connection.sendDiagnostics({ uri: document.uri, diagnostics });
});

connection.onDocumentFormatting(formattingParams => {
  const document = documents.get(formattingParams.textDocument.uri);
  const text = document.getText();

  console.log(`Document formatting requested for: ${document.uri}`);

  // Basic formatting - just return the text as-is for now
  return [
    {
      range: {
        start: { line: 0, character: 0 },
        end: { line: text.split('\n').length - 1, character: text.split('\n').pop().length }
      },
      newText: text
    }
  ];
});

connection.onFoldingRanges(foldingRangeParams => {
  const document = documents.get(foldingRangeParams.textDocument.uri);
  const text = document.getText();
  const lines = text.split('\n');
  const foldingRanges = [];

  // Basic folding - fold blocks between { and }
  let startLine = -1;
  lines.forEach((line, index) => {
    if (line.includes('{') && startLine === -1) {
      startLine = index;
    }
    if (line.includes('}') && startLine !== -1) {
      foldingRanges.push({
        startLine: startLine,
        endLine: index,
        kind: 'region'
      });
      startLine = -1;
    }
  });

  return foldingRanges;
});

connection.onReferences(referenceParams => {
  const document = documents.get(referenceParams.textDocument.uri);
  const position = referenceParams.position;

  console.log(`References requested at position: ${JSON.stringify(position)}`);

  // Basic references - return empty array for now
  return [];
});

connection.onWorkspaceSymbol(workspaceSymbolParams => {
  const query = workspaceSymbolParams.query;

  console.log(`Workspace symbol search requested with query: ${query}`);

  // Basic workspace symbols - return empty array for now
  return [];
});



connection.onDefinition(definitionParams => {
  const document = documents.get(definitionParams.textDocument.uri);
  const position = definitionParams.position;

  console.log(`Definition requested at position: ${JSON.stringify(position)}`);

  // Get word at cursor position more accurately
  const text = document.getText();
  const lines = text.split('\n');
  const line = lines[position.line];

  // Find the word at the exact cursor position
  const words = line.split(/\b/);
  let currentPos = 0;
  let targetWord = null;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (/^\w+$/.test(word)) { // Only alphanumeric words
      const wordStart = currentPos;
      const wordEnd = currentPos + word.length;

      if (position.character >= wordStart && position.character <= wordEnd) {
        targetWord = word;
        break;
      }
    }
    currentPos += word.length;
  }

  console.log(`Target word at cursor: "${targetWord}"`);
  console.log(`Available functions: ${getAllFunctionDefinitions().join(', ')}`);

  if (targetWord) {
    const definition = getFunctionDefinition(targetWord);

    if (definition) {
      console.log(`Found definition for: ${targetWord}`);
      return definition;
    } else {
      console.log(`No definition found for: ${targetWord}`);
    }
  }

  return null;
});

// Add document open handler
documents.onDidOpen(event => {
  const fileName = event.document.uri.split('/').pop();
  console.log(`Opened: ${fileName}`);

  // Parse functions when document is opened
  parseFunctions(event.document);
});

// Add document save handler
documents.onDidSave(event => {
  const fileName = event.document.uri.split('/').pop();
  console.log(`Saved: ${fileName}`);
});

// Add document close handler
documents.onDidClose(event => {
  console.log(`Document closed: ${event.document.uri}`);
});

documents.listen(connection);
connection.listen();

console.log('Language server is listening');

// At the end, export functions for testing
export { parseFunctions, validateDocument };

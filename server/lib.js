// server/lib.js

// Store function definitions
const functionDefinitions = new Map();

// Parse functions in document
function parseFunctions(document) {
  const text = document.getText();
  const lines = text.split('\n');
  const functions = [];

  lines.forEach((line, lineIndex) => {
    const funcMatch = line.match(/func\s+(\w+)\s*\(/);
    if (funcMatch) {
      const funcName = funcMatch[1];
      const range = {
        start: { line: lineIndex, character: 0 },
        end: { line: lineIndex, character: line.length }
      };

      functions.push({
        name: funcName,
        range: range,
        uri: document.uri
      });

      // Store in global map
      functionDefinitions.set(funcName, {
        uri: document.uri,
        range: range
      });
    }
  });

  return functions;
}

// Get function definition by name
function getFunctionDefinition(funcName) {
  return functionDefinitions.get(funcName);
}

// Get all function definitions
function getAllFunctionDefinitions() {
  return Array.from(functionDefinitions.keys());
}

function validateDocument(document) {
  const diagnostics = [];
  const text = document.getText();

  // Basic validation - check for unmatched quotes
  const lines = text.split('\n');
  lines.forEach((line, index) => {
    const singleQuotes = (line.match(/'/g) || []).length;
    const doubleQuotes = (line.match(/"/g) || []).length;

    if (singleQuotes % 2 !== 0) {
      diagnostics.push({
        severity: 1, // Warning
        range: {
          start: { line: index, character: 0 },
          end: { line: index, character: line.length }
        },
        message: 'Unmatched single quote',
        source: 'simonlang'
      });
    }

    if (doubleQuotes % 2 !== 0) {
      diagnostics.push({
        severity: 1, // Warning
        range: {
          start: { line: index, character: 0 },
          end: { line: index, character: line.length }
        },
        message: 'Unmatched double quote',
        source: 'simonlang'
      });
    }
  });

  return diagnostics;
}

export { parseFunctions, validateDocument, getFunctionDefinition, getAllFunctionDefinitions };

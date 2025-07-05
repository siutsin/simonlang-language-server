import { test, describe } from 'node:test';
import assert from 'node:assert';
import { parseFunctions, validateDocument } from '../server/lib.js';

describe('Language Server Tests', () => {
  test('parseFunctions should find function definitions', () => {
    const mockDocument = {
      getText: () => `func hello() {\n  'Hello World'\n}\n\nfunc goodbye() {\n  \"Goodbye\"\n}`,
      uri: 'file:///test/test.simon'
    };

    const functions = parseFunctions(mockDocument);

    assert.strictEqual(functions.length, 2);
    assert.strictEqual(functions[0].name, 'hello');
    assert.strictEqual(functions[1].name, 'goodbye');
  });

  test('validateDocument should detect unmatched quotes', () => {
    const mockDocument = {
      getText: () => `func test() {\n  'unmatched quote\n  \"unmatched double quote\n}`,
      uri: 'file:///test/test.simon'
    };

    const diagnostics = validateDocument(mockDocument);

    assert.strictEqual(diagnostics.length, 2);
    assert.strictEqual(diagnostics[0].message, 'Unmatched single quote');
    assert.strictEqual(diagnostics[1].message, 'Unmatched double quote');
  });

  test('validateDocument should pass valid document', () => {
    const mockDocument = {
      getText: () => `func test() {\n  'valid quote'\n  \"valid double quote\"\n}`,
      uri: 'file:///test/test.simon'
    };

    const diagnostics = validateDocument(mockDocument);

    assert.strictEqual(diagnostics.length, 0);
  });
});

import { it, expect } from 'vitest';
import { Lexer } from '../../src';

// Comes from Laravel https://github.com/laravel/framework/blob/10.x/src/Illuminate/Collections/Collection.php
const commonSource = `
/**
 * @template TKey of array-key
 *
 * @template-covariant TValue
 *
 * @implements \\ArrayAccess<TKey, TValue>
 * @implements \\Illuminate\\Support\\Enumerable<TKey, TValue>
 */
`.trim();

it('test tokenize for a very common doc annotation', () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize(commonSource);
  expect(tokens).toMatchSnapshot('commonSource');
});

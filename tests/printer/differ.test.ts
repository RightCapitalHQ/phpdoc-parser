import { describe, expect, test } from 'vitest';
import {
  DiffElem,
  DiffElemType,
} from '../../src/phpdoc-parser/printer/diff-elem';
import { Differ } from '../../src/phpdoc-parser/printer/differ';

/**
 * Format an array of DiffElem instances into a string.
 */
function formatDiffString(diff: DiffElem<string>[]): string {
  let diffStr = '';
  for (const diffElem of diff) {
    switch (diffElem.type) {
      case DiffElemType.KEEP:
        diffStr += diffElem.old;
        break;
      case DiffElemType.REMOVE:
        diffStr += `-${diffElem.old}`;
        break;
      case DiffElemType.ADD:
        diffStr += `+${diffElem.new}`;
        break;
      case DiffElemType.REPLACE:
        diffStr += `/${diffElem.old}${diffElem.new}`;
        break;
      default:
        break;
    }
  }
  return diffStr;
}

describe('DifferTest', () => {
  const testCases = [
    ['abc', 'abc', 'abc'],
    ['abc', 'abcdef', 'abc+d+e+f'],
    ['abcdef', 'abc', 'abc-d-e-f'],
    ['abcdef', 'abcxyzdef', 'abc+x+y+zdef'],
    ['axyzb', 'ab', 'a-x-y-zb'],
    ['abcdef', 'abxyef', 'ab-c-d+x+yef'],
    ['abcdef', 'cdefab', '-a-bcdef+a+b'],
  ];

  test.each(testCases)(
    'Testing difference between %s and %s',
    (oldStr, newStr, expectedDiffStr) => {
      const differ = new Differ<string>((a, b) => a === b);
      const diff = differ.diff(Array.from(oldStr), Array.from(newStr));
      expect(formatDiffString(diff)).toEqual(expectedDiffStr);
    },
  );

  const replacementTestCases = [
    ['abcde', 'axyze', 'a/bx/cy/dze'],
    ['abcde', 'xbcdy', '/axbcd/ey'],
    ['abcde', 'axye', 'a-b-c-d+x+ye'],
    ['abcde', 'axyzue', 'a-b-c-d+x+y+z+ue'],
  ];

  test.each(replacementTestCases)(
    'Testing difference with replacements between %s and %s',
    (oldStr, newStr, expectedDiffStr) => {
      const differ = new Differ<string>((a, b) => a === b);
      const diff = differ.diffWithReplacements(
        Array.from(oldStr),
        Array.from(newStr),
      );
      expect(formatDiffString(diff)).toEqual(expectedDiffStr);
    },
  );
});

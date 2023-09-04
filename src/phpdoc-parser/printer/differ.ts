/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
import { DiffElem, DiffElemType } from './diff-elem';

/**
 * Inspired by https://github.com/nikic/PHP-Parser/tree/36a6dcd04e7b0285e8f0868f44bd4927802f7df1
 *
 * Copyright (c) 2011, Nikita Popov
 * All rights reserved.
 *
 * Implements the Myers diff algorithm.
 *
 * Myers, Eugene W. "An O (ND) difference algorithm and its variations."
 * Algorithmica 1.1 (1986): 251-266.
 *
 * @template T
 */
export class Differ<T> {
  private isEqual: (a: T, b: T) => boolean;

  constructor(isEqual: (a: T, b: T) => boolean) {
    this.isEqual = isEqual;
  }

  public diff(old: T[], newElements: T[]): DiffElem<T>[] {
    const [trace, x, y] = this.calculateTrace(old, newElements);
    return this.extractDiff(trace, x, y, old, newElements);
  }

  public diffWithReplacements(old: T[], newElements: T[]): DiffElem<T>[] {
    return this.coalesceReplacements(this.diff(old, newElements));
  }

  private calculateTrace(
    old: T[],
    newElements: T[],
  ): [Array<{ [key: number]: number }>, number, number] {
    const n = old.length;
    const m = newElements.length;
    const max = n + m;
    const v: { [key: number]: number } = { 1: 0 };
    const trace: Array<{ [key: number]: number }> = [];
    for (let d = 0; d <= max; d++) {
      trace.push({ ...v });
      for (let k = -d; k <= d; k += 2) {
        let x: number;
        if (k === -d || (k !== d && v[k - 1] < v[k + 1])) {
          x = v[k + 1];
        } else {
          x = v[k - 1] + 1;
        }

        let y = x - k;
        while (x < n && y < m && this.isEqual(old[x], newElements[y])) {
          x++;
          y++;
        }

        v[k] = x;
        if (x >= n && y >= m) {
          return [trace, x, y];
        }
      }
    }
    throw new Error('Should not happen');
  }

  private extractDiff(
    trace: Array<{ [key: number]: number }>,
    x: number,
    y: number,
    old: T[],
    newElements: T[],
  ): DiffElem<T>[] {
    const result: DiffElem<T>[] = [];
    for (let d = trace.length - 1; d >= 0; d--) {
      const v = trace[d];
      const k = x - y;

      let prevK: number;
      if (k === -d || (k !== d && v[k - 1] < v[k + 1])) {
        prevK = k + 1;
      } else {
        prevK = k - 1;
      }

      const prevX = v[prevK];
      const prevY = prevX - prevK;

      while (x > prevX && y > prevY) {
        result.push(
          new DiffElem(DiffElemType.KEEP, old[x - 1], newElements[y - 1]),
        );
        x--;
        y--;
      }

      if (d === 0) {
        break;
      }

      while (x > prevX) {
        result.push(new DiffElem(DiffElemType.REMOVE, old[x - 1], null));
        x--;
      }

      while (y > prevY) {
        result.push(new DiffElem(DiffElemType.ADD, null, newElements[y - 1]));
        y--;
      }
    }
    return result.reverse();
  }

  private coalesceReplacements(diff: DiffElem<T>[]): DiffElem<T>[] {
    const newDiff: DiffElem<T>[] = [];
    const c = diff.length;
    for (let i = 0; i < c; i++) {
      const diffType = diff[i].type;
      if (diffType !== DiffElemType.REMOVE) {
        newDiff.push(diff[i]);
        // eslint-disable-next-line no-continue
        continue;
      }

      let j = i;
      while (j < c && diff[j].type === DiffElemType.REMOVE) {
        j++;
      }

      let k = j;
      while (k < c && diff[k].type === DiffElemType.ADD) {
        k++;
      }

      if (j - i === k - j) {
        const len = j - i;
        for (let n = 0; n < len; n++) {
          newDiff.push(
            new DiffElem<T>(
              DiffElemType.REPLACE,
              diff[i + n].old,
              diff[j + n].new,
            ),
          );
        }
      } else {
        for (; i < k; i++) {
          newDiff.push(diff[i]);
        }
      }
      i = k - 1;
    }
    return newDiff;
  }
}

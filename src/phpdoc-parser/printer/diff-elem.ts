/**
 * This class is converted via GPT based on this file:
 * https://github.com/phpstan/phpdoc-parser/blob/1.23.x/src/Printer/DiffElem.php
 *
 * Inspired by https://github.com/nikic/PHP-Parser/tree/36a6dcd04e7b0285e8f0868f44bd4927802f7df1
 *
 * Copyright (c) 2011, Nikita Popov
 * All rights reserved.
 *
 * Implements the Myers diff algorithm.
 *
 */
export class DiffElem<EleType> {
  public old: EleType;

  public new: EleType;

  public constructor(
    public type: DiffElemType,
    oldEle: EleType,
    newEle: EleType,
  ) {
    this.type = type;
    this.old = oldEle;
    this.new = newEle;
  }
}

export enum DiffElemType {
  KEEP = 1,
  REMOVE = 2,
  ADD = 3,
  REPLACE = 4,
}

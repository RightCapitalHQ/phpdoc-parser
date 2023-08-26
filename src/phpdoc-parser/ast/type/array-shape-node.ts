import { ArrayShapeItemNode } from './array-shape-item-node';
import { TypeNode } from './type-node';

export enum ArrayShapeNodeKind {
  ARRAY = 'array',
  LIST = 'list',
}

export class ArrayShapeNode extends TypeNode {
  constructor(
    public items: (ArrayShapeItemNode | string)[],
    public sealed: boolean = true,
    public kind: ArrayShapeNodeKind = ArrayShapeNodeKind.ARRAY,
  ) {
    super();
    this.items = items;
    this.sealed = sealed;
    this.kind = kind;
  }

  public toString(): string {
    const { items } = this;

    if (!this.sealed) {
      items.push('...');
    }

    return `${this.kind}{${items.join(', ')}}`;
  }

  public getNodeType(): string {
    return 'ArrayShapeNode';
  }
}

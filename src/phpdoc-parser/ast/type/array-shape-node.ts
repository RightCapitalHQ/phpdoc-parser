import type { ArrayShapeItemNode } from './array-shape-item-node';
import type { ArrayShapeUnsealedTypeNode } from './array-shape-unsealed-type-node';
import { TypeNode } from './type-node';

export enum ArrayShapeNodeKind {
  ARRAY = 'array',
  LIST = 'list',
  NON_EMPTY_ARRAY = 'non-empty-array',
  NON_EMPTY_LIST = 'non-empty-list',
}

export class ArrayShapeNode extends TypeNode {
  constructor(
    public items: (ArrayShapeItemNode | string)[],
    public sealed: boolean = true,
    public kind: ArrayShapeNodeKind = ArrayShapeNodeKind.ARRAY,
    public unsealedType: ArrayShapeUnsealedTypeNode | null = null,
  ) {
    super();
    this.items = items;
    this.sealed = sealed;
    this.kind = kind;
    this.unsealedType = unsealedType;
  }

  public static createSealed(
    items: (ArrayShapeItemNode | string)[],
    kind: ArrayShapeNodeKind = ArrayShapeNodeKind.ARRAY,
  ): ArrayShapeNode {
    return new ArrayShapeNode(items, true, kind, null);
  }

  public static createUnsealed(
    items: (ArrayShapeItemNode | string)[],
    unsealedType: ArrayShapeUnsealedTypeNode | null,
    kind: ArrayShapeNodeKind = ArrayShapeNodeKind.ARRAY,
  ): ArrayShapeNode {
    return new ArrayShapeNode(items, false, kind, unsealedType);
  }

  public toString(): string {
    const items: (ArrayShapeItemNode | string)[] = [...this.items];

    if (!this.sealed) {
      items.push(
        `...${this.unsealedType !== null ? this.unsealedType.toString() : ''}`,
      );
    }

    return `${this.kind}{${items.join(', ')}}`;
  }

  public getNodeType(): string {
    return 'ArrayShapeNode';
  }
}

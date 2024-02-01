import type { ObjectShapeItemNode } from './object-shape-item-node';
import { TypeNode } from './type-node';

export class ObjectShapeNode extends TypeNode {
  constructor(public items: ObjectShapeItemNode[]) {
    super();
  }

  public toString(): string {
    return `object{${this.items.join(', ')}`;
  }

  public getNodeType(): string {
    return 'ObjectShapeNode';
  }
}

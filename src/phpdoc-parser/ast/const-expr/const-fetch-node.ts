import { ConstExprNode } from './const-expr-node';

export class ConstFetchNode extends ConstExprNode {
  constructor(
    public className: string,
    public name: string,
  ) {
    super();
  }

  public toString(): string {
    if (this.className === '') {
      return this.name;
    }

    return `${this.className}::${this.name}`;
  }

  public getNodeType(): string {
    return 'ConstFetchNode';
  }
}

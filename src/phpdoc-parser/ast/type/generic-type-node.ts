import type { IdentifierTypeNode } from './identifier-type-node';
import { TypeNode } from './type-node';

export type GenericTypeNodeVariance =
  | 'invariant'
  | 'covariant'
  | 'contravariant'
  | 'bivariant';

export class GenericTypeNode extends TypeNode {
  public static readonly VARIANCE_INVARIANT = 'invariant' as const;

  public static readonly VARIANCE_COVARIANT = 'covariant' as const;

  public static readonly VARIANCE_CONTRAVARIANT = 'contravariant' as const;

  public static readonly VARIANCE_BIVARIANT = 'bivariant' as const;

  constructor(
    public type: IdentifierTypeNode,
    public genericTypes: TypeNode[],
    public variances: string[] = [],
  ) {
    super();
  }

  public toString(): string {
    const genericTypes: string[] = [];

    // eslint-disable-next-line no-restricted-syntax, guard-for-in, @typescript-eslint/no-for-in-array
    for (const index in this.genericTypes) {
      const type = this.genericTypes[index];
      const variance =
        this.variances[index] || GenericTypeNode.VARIANCE_INVARIANT;
      if (variance === GenericTypeNode.VARIANCE_INVARIANT) {
        genericTypes.push(type.toString());
      } else if (variance === GenericTypeNode.VARIANCE_BIVARIANT) {
        genericTypes.push('*');
      } else {
        genericTypes.push(`${variance} ${type.toString()}`);
      }
    }

    return `${this.type.toString()}<${genericTypes.join(', ')}>`;
  }

  public getNodeType(): string {
    return 'GenericTypeNode';
  }
}

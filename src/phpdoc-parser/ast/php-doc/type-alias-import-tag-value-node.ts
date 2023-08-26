import { PhpDocTagValueNode } from './php-doc-tag-value-node';
import { IdentifierTypeNode } from '../type/identifier-type-node';

export class TypeAliasImportTagValueNode extends PhpDocTagValueNode {
  constructor(
    public importedAlias: string,
    public importedFrom: IdentifierTypeNode,
    public importedAs?: string,
  ) {
    super();
  }

  public toString(): string {
    return `${this.importedAlias} from ${this.importedFrom}${(this.importedAs
      ? ` as ${this.importedAs}`
      : ''
    ).trim()}`;
  }

  public getNodeType(): string {
    return 'TypeAliasImportTagValueNode';
  }
}

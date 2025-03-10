import type { IdentifierTypeNode } from '../type/identifier-type-node';
import { PhpDocTagValueNode } from './php-doc-tag-value-node';

export class TypeAliasImportTagValueNode extends PhpDocTagValueNode {
  constructor(
    public importedAlias: string,
    public importedFrom: IdentifierTypeNode,
    public importedAs?: string,
  ) {
    super();
  }

  public toString(): string {
    return `${this.importedAlias} from ${this.importedFrom.toString()}${(this
      .importedAs
      ? ` as ${this.importedAs}`
      : ''
    ).trim()}`;
  }

  public getNodeType(): string {
    return 'TypeAliasImportTagValueNode';
  }
}

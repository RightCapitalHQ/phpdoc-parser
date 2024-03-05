import { ImportDeclaration, TypeNode } from 'typescript';

export abstract class BaseTypeTranspiler<SourceTypeNode> {
  constructor(
    public nameNodePathResolver: (nodeParts: string[]) => {
      path: string;
      name: string;
      isTypeOnly: boolean;
    },
  ) {}

  public abstract transpile(typeNode: SourceTypeNode): TypeNode;

  public beforeTranspile() {
    // Reset importDeclarations
    this.importDeclarations = [];
  }

  public getImportDeclarations() {
    return this.importDeclarations;
  }

  protected importDeclarations: ImportDeclaration[];
}

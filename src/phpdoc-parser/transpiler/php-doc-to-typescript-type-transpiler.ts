import { ImportDeclaration, SyntaxKind, TypeNode, factory } from 'typescript';
import { ArrayShapeItemNode } from '../ast/type/array-shape-item-node';
import { ArrayShapeNode } from '../ast/type/array-shape-node';
import { ArrayTypeNode } from '../ast/type/array-type-node';
import { ObjectShapeItemNode } from '../ast/type/object-shape-item-node';
import { ObjectShapeNode } from '../ast/type/object-shape-node';
import { TypeNode as PhpDocTypeNode } from '../ast/type/type-node';
import { UnionTypeNode } from '../ast/type/union-type-node';

export type NameNodePathResolver<T> = (
  this: T,
  nodeParts: string[],
) => {
  path: string;
  name: string;
  isTypeOnly: boolean;
};

export class PhpDocTypeNodeToTypescriptTypeNodeTranspiler {
  constructor(
    public nameNodePathResolver: (nodeParts: string[]) => {
      path: string;
      name: string;
      isTypeOnly: boolean;
    },
  ) {}

  public transpile(sourceTypeNode: PhpDocTypeNode): TypeNode {
    // type_a | type_b | type_c
    if (sourceTypeNode instanceof UnionTypeNode) {
      return factory.createUnionTypeNode(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        sourceTypeNode.types.map(this.transpile.bind(this)),
      );
    }

    // type[]
    if (sourceTypeNode instanceof ArrayTypeNode) {
      return factory.createArrayTypeNode(this.transpile(sourceTypeNode.type));
    }

    // array{'foo': int, "bar"?: string, 0: boolean}
    if (sourceTypeNode instanceof ArrayShapeNode) {
      return factory.createTypeLiteralNode(
        sourceTypeNode.items.map((item: ArrayShapeItemNode) => {
          return factory.createPropertySignature(
            undefined,
            item.keyName.toString(),
            item.optional
              ? factory.createToken(SyntaxKind.QuestionToken)
              : undefined,
            this.transpile(item.valueType),
          );
        }),
      );
    }

    // object{'foo': int, "bar"?: string}
    if (sourceTypeNode instanceof ObjectShapeNode) {
      return factory.createTypeLiteralNode(
        sourceTypeNode.items.map((item: ObjectShapeItemNode) => {
          return factory.createPropertySignature(
            undefined,
            item.keyName.toString(),
            item.optional
              ? factory.createToken(SyntaxKind.QuestionToken)
              : undefined,
            this.transpile(item.valueType),
          );
        }),
      );
    }

    // case 1: array<Type>, non-empty-array<Type>, list<Type>, non-empty-list<Type>
    // case 2: array<int, Type>, non-empty-array<int, Type>;
    // case 3: \Illuminate\Database\Eloquent\Collection<\App\Models\Account>;
    if (sourceTypeNode.isGenericTypeNode()) {
      if (
        [
          'array',
          'non-empty-array',
          'list',
          'non-empty-list',
          '\\Illuminate\\Database\\Eloquent\\Collection',
        ].includes(sourceTypeNode.type.name)
      ) {
        if (sourceTypeNode.genericTypes.length === 1) {
          // turn into regular Array like Type[]
          return factory.createArrayTypeNode(
            this.transpile(sourceTypeNode.genericTypes[0]),
          );
        }
        if (sourceTypeNode.genericTypes.length === 2) {
          // Record<KeyType, ValueType>
          return factory.createTypeReferenceNode(
            factory.createIdentifier('Record'),
            [
              this.transpile(sourceTypeNode.genericTypes[0]),
              this.transpile(sourceTypeNode.genericTypes[1]),
            ],
          );
        }
      }

      throw Error('Not yet supported Generic type so far');
    }

    if (sourceTypeNode.isIdentifierTypeNode()) {
      // Ref: the Basic type defined here
      // https://phpstan.org/writing-php-code/phpdoc-types#basic-types
      if (['bool', 'boolean', 'true', 'false'].includes(sourceTypeNode.name)) {
        return factory.createKeywordTypeNode(SyntaxKind.BooleanKeyword);
      }

      if (['int', 'integer', 'float', 'double'].includes(sourceTypeNode.name)) {
        return factory.createKeywordTypeNode(SyntaxKind.NumberKeyword);
      }

      if (sourceTypeNode.name === 'string') {
        return factory.createKeywordTypeNode(SyntaxKind.StringKeyword);
      }

      if (sourceTypeNode.name === 'array-key') {
        // array-key equals (string | int)
        return factory.createUnionTypeNode([
          factory.createKeywordTypeNode(SyntaxKind.StringKeyword),
          factory.createKeywordTypeNode(SyntaxKind.NumberKeyword),
        ]);
      }

      if (sourceTypeNode.name === 'scalar') {
        // scalar is equals (float|integer|string|boolean)
        // https://github.com/phpDocumentor/phpDocumentor/issues/694
        return factory.createUnionTypeNode([
          factory.createKeywordTypeNode(SyntaxKind.StringKeyword),
          factory.createKeywordTypeNode(SyntaxKind.NumberKeyword),
          factory.createKeywordTypeNode(SyntaxKind.BooleanKeyword),
        ]);
      }

      if (sourceTypeNode.name === 'mixed') {
        // PHP mixed to TS any
        factory.createKeywordTypeNode(SyntaxKind.AnyKeyword);
      }

      if (sourceTypeNode.name === 'void') {
        return factory.createToken(SyntaxKind.VoidKeyword);
      }

      if (sourceTypeNode.name === 'null') {
        return factory.createLiteralTypeNode(factory.createNull());
      }

      // Possibly Class Node
      // Expr
      // Node\Arg
      // \Ast\Node\Arg
      // the Name starts with uppercase character or '\'
      if (/^[A-Z\\]/.test(sourceTypeNode.name)) {
        const nameNodeParts = sourceTypeNode.name.split('\\');

        const { name, path, isTypeOnly } =
          this.nameNodePathResolver(nameNodeParts);

        if (name !== 'string' && path !== '') {
          this.importDeclarations.push(
            factory.createImportDeclaration(
              undefined,
              factory.createImportClause(
                isTypeOnly,
                undefined,
                factory.createNamedImports([
                  factory.createImportSpecifier(
                    false,
                    undefined,
                    factory.createIdentifier(name),
                  ),
                ]),
              ),
              factory.createStringLiteral(path),
              undefined,
            ),
          );
        }

        return factory.createTypeReferenceNode(
          factory.createIdentifier(name),
          undefined,
        );
      }
    }

    // return any type as a fallback
    return factory.createKeywordTypeNode(SyntaxKind.AnyKeyword);
  }

  public beforeTranspile() {
    // Reset importDeclarations
    this.importDeclarations = [];
  }

  public getImportDeclarations() {
    return this.importDeclarations;
  }

  protected importDeclarations: ImportDeclaration[];
}

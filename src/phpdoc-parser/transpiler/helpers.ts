import _ = require('lodash');
import * as ts from 'typescript';

/**
 * Creates and returns an AST 'SourceFile' root node.
 *
 * @param fileName The name of the source file, for example, 'example.ts'
 * @param sourceText The text content of the source file
 * @param scriptTarget Specifies the ECMAScript version to be used by the compiler, default is the latest version
 * @param scriptKind The kind of the file (TS, JS, JSON, or others), default is TS
 * @return Returns the newly created AST 'SourceFile' root node
 */
export function createSourceFileRoot(
  fileName: string,
  sourceText = '',
  scriptTarget: ts.ScriptTarget = ts.ScriptTarget.Latest,
  scriptKind: ts.ScriptKind = ts.ScriptKind.TS,
): ts.SourceFile {
  const sourceFile: ts.SourceFile = ts.createSourceFile(
    fileName,
    sourceText,
    scriptTarget,
    true,
    scriptKind,
  );

  return sourceFile;
}

/**
 * Adds one or more new nodes to the 'statements' of a given 'SourceFile' node.
 *
 * @param sourceFile The 'SourceFile' node to which new statements are to be added
 * @param newStatements An array of new statement nodes to be added
 * @return Returns the 'SourceFile' node with the new array of statements added
 */
export function addStatementsToNode(
  sourceFile: ts.SourceFile,
  newStatements: ts.Statement[],
): ts.SourceFile {
  const updatedStatements = ts.factory.createNodeArray([
    ...sourceFile.statements,
    ...newStatements,
  ]);

  return ts.factory.updateSourceFile(sourceFile, updatedStatements);
}

export function renderTsNodeToString(
  tsNode: ts.TypeNode | ts.ImportDeclaration,
): string {
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

  const resultFile = createSourceFileRoot('example.ts');

  return printer.printNode(ts.EmitHint.Unspecified, tsNode, resultFile);
}

export function createImportDeclarationNode(
  symbols: string[],
  fileName: string,
): ts.ImportDeclaration {
  const importClause = ts.factory.createImportClause(
    false, // no default import
    undefined,
    ts.factory.createNamedImports(
      symbols.map((symbol) =>
        ts.factory.createImportSpecifier(
          false,
          undefined,
          ts.factory.createIdentifier(symbol),
        ),
      ),
    ),
  );

  // Create a string literal for the module specifier
  const moduleSpecifier = ts.factory.createStringLiteral(fileName);

  // Create the import declaration (e.g., "import { TypeName } from 'fileName';")
  const importDeclaration = ts.factory.createImportDeclaration(
    undefined, // no modifiers
    importClause,
    moduleSpecifier,
  );

  return importDeclaration;
}

/**
 * Creates an export declaration node.
 * @param symbols An array of the symbols that should be exported.
 * @param moduleSpecifierString Optional. A string indicating the module from which the symbols are exported, e.g., './module'.
 * @returns A TypeScript export declaration node.
 */
export function createExportDeclarationNode(
  symbols: string[], // An array of the symbols that should be exported
  moduleSpecifierString?: string, // Optional module specifier (e.g., './module')
): ts.ExportDeclaration {
  const exportSpecifiers = symbols.map((symbol) =>
    ts.factory.createExportSpecifier(
      false,
      undefined, // Use 'undefined' if the local name and exported name are the same
      ts.factory.createIdentifier(symbol),
    ),
  );

  const namedExports = ts.factory.createNamedExports(exportSpecifiers);

  const moduleSpecifier = moduleSpecifierString
    ? ts.factory.createStringLiteral(moduleSpecifierString)
    : undefined;

  // Create the export declaration (e.g., "export { SymbolName } from './module';")
  const exportDeclaration = ts.factory.createExportDeclaration(
    undefined, // modifiers
    false, // isTypeOnly (e.g., export type)
    namedExports, // NamedExports
    moduleSpecifier, // moduleSpecifier (can be 'undefined' for local exports)
  );

  return exportDeclaration;
}

/**
 * Create a TypeScript interface node (ts.InterfaceDeclaration) with given name and members.
 *
 * @param interfaceName The name of the interface.
 * @param members An array of ts.TypeElement representing the interface members (properties, methods, etc.).
 * @param typeParameters An array of ts.TypeParameterDeclaration for any generic type parameters.
 * @returns ts.InterfaceDeclaration The interface declaration node.
 */
export function createInterfaceNode(
  interfaceName: string,
  members: ts.TypeElement[] = [],
  typeParameters: ts.TypeParameterDeclaration[] = [],
): ts.InterfaceDeclaration {
  const interfaceDeclaration = ts.factory.createInterfaceDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)], // Interface will be exportable
    ts.factory.createIdentifier(interfaceName), // Interface name
    typeParameters, // Type parameters (for generics), if any
    undefined, // No heritage clauses (e.g., no extends or implements)
    members, // Members of the interface
  );

  return interfaceDeclaration;
}

/**
 * Creates a comment node in TypeScript's syntax tree.
 * @param commentText The text of the comment.
 * @param isMultiLine Optional. Indicates if the comment should be a multi-line comment. Defaults to `true`.
 * @param hasTrailingNewLine Optional. Indicates if the comment should have a trailing newline. Defaults to `true`.
 * @returns A TypeScript statement node with the attached comment.
 */
export function createCommentNode(
  commentText: string,
  isMultiLine: boolean = true,
  hasTrailingNewLine: boolean = true,
): ts.Statement {
  const emptyStatement = ts.factory.createEmptyStatement();

  let formattedCommentText: string;
  if (isMultiLine) {
    formattedCommentText = `*\n * ${commentText.split('\n').join('\n * ')}\n `;
  } else {
    formattedCommentText = commentText;
  }

  const emptyStatementWithComment = ts.addSyntheticLeadingComment(
    emptyStatement,
    isMultiLine
      ? ts.SyntaxKind.MultiLineCommentTrivia
      : ts.SyntaxKind.SingleLineCommentTrivia,
    formattedCommentText,
    hasTrailingNewLine,
  );

  return emptyStatementWithComment;
}

/**
 * Create and return an AST node for a TypeScript enum declaration.
 *
 * @param enumName The name of the enum.
 * @param members A list of key-value pairs for the enum members, each member is in the format [key, value].
 * @param isConst Whether to create a constant enum (`const enum`), default is not to create.
 * @returns ts.EnumDeclaration The enum declaration node.
 */
export function createEnumNode(
  enumName: string,
  members: [string, number | string][],
  isConst = false,
): ts.EnumDeclaration {
  const memberNodes = members.map(([key, value]) =>
    ts.factory.createEnumMember(
      key,
      typeof value === 'number'
        ? ts.factory.createNumericLiteral(value)
        : ts.factory.createStringLiteral(value),
    ),
  );

  const enumDeclaration = ts.factory.createEnumDeclaration(
    isConst
      ? [
          ts.factory.createModifier(ts.SyntaxKind.ExportKeyword),
          ts.factory.createModifier(ts.SyntaxKind.ConstKeyword),
        ]
      : [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    ts.factory.createIdentifier(enumName),
    memberNodes,
  );

  return enumDeclaration;
}

// TS interfaces corresponding to the provided PhpDocNode structure
type PhpDocNode = {
  nodeType: string;
  children: PhpDocTagNode[];
};

type PhpDocTagNode = {
  nodeType: string;
  name: string;
  value: PropertyTagValueNode;
};

type PropertyTagValueNode = {
  nodeType: string;
  type: UnionTypeNode | ArrayShapeNode;
  propertyName: string;
  description: string;
};

type UnionTypeNode = {
  nodeType: string;
  types: IdentifierTypeNode[];
};

type IdentifierTypeNode = {
  nodeType: string;
  name: string;
};

type ArrayShapeNode = {
  nodeType: string;
  items: ArrayShapeItemNode[];
  sealed: boolean;
  kind: string;
};

type ArrayShapeItemNode = {
  nodeType: string;
  keyName: IdentifierTypeNode;
  optional: boolean;
  valueType: IdentifierTypeNode;
};

// TypeScript property representation
type TsProperty = {
  propertyName: string;
  type: string;
};

// Function to transform the PhpDocNode structure to an array of TsProperty
export function transformPhpDocToTypeScriptObject(
  phpDocNode: PhpDocNode,
): TsProperty[] {
  return phpDocNode.children
    .filter((tag) => tag.name === '@property-read' || tag.name === '@property')
    .map((tag) => {
      const propertyName = _.camelCase(
        tag.value.propertyName.replace(/^\$/, ''),
      ); // remove PHP variable '$' prefix
      const type = transformTypeNodeToTypeScript(tag.value.type);
      return { propertyName, type };
    });
}

// Helper function to transform different PhpDoc type nodes to TypeScript type
function transformTypeNodeToTypeScript(
  typeNode: UnionTypeNode | ArrayShapeNode,
): string {
  if (typeNode.nodeType === 'UnionTypeNode') {
    return (typeNode as UnionTypeNode).types
      .map((t) => transformIdentifierTypeNodeToTypeScript(t))
      .join(' | ');
  }
  if (typeNode.nodeType === 'ArrayShapeNode') {
    // In TypeScript, the most corresponding type would be an object type or a record type
    const entries = (typeNode as ArrayShapeNode).items
      .map(
        (item) =>
          `${_.camelCase(item.keyName.name)}${
            item.optional ? '?' : ''
          }: ${transformIdentifierTypeNodeToTypeScript(item.valueType)}`,
      )
      .join('; ');
    return `{ ${entries} }`;
  }

  return 'any'; // Fallback for unknown node types
}

// Helper function to convert IdentifierTypeNode to TypeScript type string
function transformIdentifierTypeNodeToTypeScript(
  identifierTypeNode: IdentifierTypeNode,
): string {
  switch (identifierTypeNode.name) {
    case 'string':
    case 'int':
    case 'null':
      // Directly use the type as it is
      return identifierTypeNode.name;
    // TODO: Add cases for other common PHP types that have direct TypeScript equivalents (e.g., 'float' -> 'number')
    case 'float':
      return 'number';
    case 'boolean':
    case 'bool':
      return 'boolean';
    case 'date':
    case 'datetime':
    case 'immutable_date':
    case 'immutable_datetime':
    case 'CarbonInterface':
    case '\\Carbon\\CarbonInterface':
    case '\\Carbon\\Carbon':
    case '\\Carbon\\CarbonImmutable':
      // Date will convert to string as output format in API
      return 'string';
    case 'array':
      return 'any';
    case 'Collection':
      return 'any[]';
    case 'mixed':
      return 'any';
    default:
      return 'any';
  }
}

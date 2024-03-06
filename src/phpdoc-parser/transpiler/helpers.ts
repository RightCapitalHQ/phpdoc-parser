import {
  type ImportDeclaration,
  factory,
  type ExportDeclaration,
  type TypeElement,
  type TypeParameterDeclaration,
  type HeritageClause,
  type InterfaceDeclaration,
  SyntaxKind,
  ScriptTarget,
  type SourceFile,
  createSourceFile,
  ScriptKind,
  type Statement,
  addSyntheticLeadingComment,
  type EnumDeclaration,
  type ModifierSyntaxKind,
  type Node,
  createPrinter,
  NewLineKind,
  EmitHint,
} from 'typescript';

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
  scriptTarget: ScriptTarget = ScriptTarget.Latest,
  scriptKind: ScriptKind = ScriptKind.TS,
): SourceFile {
  const sourceFile: SourceFile = createSourceFile(
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
 * @param sourceFile The 'SourceFile' node to which new statements are to be added
 * @param newStatements An array of new statement nodes to be added
 * @return Returns the 'SourceFile' node with the new array of statements added
 */
export function addStatementsToNode(
  sourceFile: SourceFile,
  newStatements: Statement[],
): SourceFile {
  const updatedStatements = factory.createNodeArray([
    ...sourceFile.statements,
    ...newStatements,
  ]);

  return factory.updateSourceFile(sourceFile, updatedStatements);
}

/**
 * Creates an ImportDeclaration node for TypeScript code generation.
 * @param symbols An array of string representing the names of the symbols to be imported.
 * @param fileName The module path string from which symbols are to be imported.
 * @returns A TypeScript ImportDeclaration node that represents the import statement.
 */
export function createImportDeclarationNode(
  symbols: string[],
  filePath: string,
): ImportDeclaration {
  const importClause = factory.createImportClause(
    true,
    undefined,
    factory.createNamedImports(
      symbols.map((symbol) =>
        factory.createImportSpecifier(
          false,
          undefined,
          factory.createIdentifier(symbol),
        ),
      ),
    ),
  );

  const moduleSpecifier = factory.createStringLiteral(filePath);

  const importDeclaration = factory.createImportDeclaration(
    undefined,
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
  symbols: string[],
  moduleSpecifierString?: string,
): ExportDeclaration {
  const exportSpecifiers = symbols.map((symbol) =>
    factory.createExportSpecifier(
      false,
      undefined, // Intentionally left as 'undefined' to indicate that there is no alias. This export specifier is directly exporting the identifier without renaming.
      factory.createIdentifier(symbol),
    ),
  );

  const namedExports = factory.createNamedExports(exportSpecifiers);

  const moduleSpecifier = moduleSpecifierString
    ? factory.createStringLiteral(moduleSpecifierString)
    : undefined;

  const exportDeclaration = factory.createExportDeclaration(
    undefined,
    false,
    namedExports,
    moduleSpecifier,
  );

  return exportDeclaration;
}

/**
 * Create a TypeScript interface node (InterfaceDeclaration) with given name and members.
 * @param interfaceName The name of the interface.
 * @param members An array of TypeElement representing the interface members (properties, methods, etc.).
 * @param typeParameters An array of TypeParameterDeclaration for any generic type parameters.
 * @returns InterfaceDeclaration The interface declaration node.
 */
export function createInterfaceNode(
  interfaceName: string,
  members: TypeElement[] = [],
  typeParameters: TypeParameterDeclaration[] = [],
  heritageClauses: HeritageClause[] = [],
): InterfaceDeclaration {
  const interfaceDeclaration = factory.createInterfaceDeclaration(
    [factory.createModifier(SyntaxKind.ExportKeyword)],
    factory.createIdentifier(interfaceName),
    typeParameters,
    heritageClauses,
    members,
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
): Statement {
  const emptyStatement = factory.createEmptyStatement();

  let formattedCommentText: string;
  if (isMultiLine) {
    formattedCommentText = `*\n * ${commentText.split('\n').join('\n * ')}\n `;
  } else {
    formattedCommentText = commentText;
  }

  const emptyStatementWithComment = addSyntheticLeadingComment(
    emptyStatement,
    isMultiLine
      ? SyntaxKind.MultiLineCommentTrivia
      : SyntaxKind.SingleLineCommentTrivia,
    formattedCommentText,
    hasTrailingNewLine,
  );

  return emptyStatementWithComment;
}

/**
 * Creates an enumeration (enum) node in TypeScript's syntax tree.
 * @param enumName The name of the enum.
 * @param members An array of members for the enum. Each member is a tuple consisting of the member's name (string) and its value (number or string).
 * @param modifiers An array of TypeScript syntax kind modifiers (e.g., export, const) to apply to the enum declaration.
 * @returns A TypeScript enum declaration node representing the defined enum.
 */
export function createEnumNode(
  enumName: string,
  members: [string, number | string][],
  modifiers: ModifierSyntaxKind[],
): EnumDeclaration {
  const memberNodes = members.map(([key, value]) =>
    factory.createEnumMember(
      key,
      typeof value === 'number'
        ? factory.createNumericLiteral(value)
        : factory.createStringLiteral(value),
    ),
  );

  const enumDeclaration = factory.createEnumDeclaration(
    modifiers.map((modifier) => factory.createToken(modifier)),
    factory.createIdentifier(enumName),
    memberNodes,
  );

  return enumDeclaration;
}

export function renderTsNodeToString(tsNode: Node): string {
  const printer = createPrinter({ newLine: NewLineKind.LineFeed });

  const resultFile = createSourceFileRoot('temp.ts');

  return printer.printNode(EmitHint.Unspecified, tsNode, resultFile);
}

export function renderTsSourceFileToString(sourceFile: SourceFile) {
  const printer = createPrinter({ newLine: NewLineKind.LineFeed });

  const sourceFileContent: string = printer.printFile(sourceFile);

  return sourceFileContent;
}

import { ConstExprParser } from './const-expr-parser';
import { ParserException } from './parser-exception';
import { TokenIterator } from './token-iterator';
import { TypeParser } from './type-parser';
import { BaseNode } from '../ast/base-node';
import { ConstExprNode } from '../ast/const-expr/const-expr-node';
import { AssertTagMethodValueNode } from '../ast/php-doc/assert-tag-method-value-node';
import { AssertTagPropertyValueNode } from '../ast/php-doc/assert-tag-property-value-node';
import { AssertTagValueNode } from '../ast/php-doc/assert-tag-value-node';
import { DeprecatedTagValueNode } from '../ast/php-doc/deprecated-tag-value-node';
import { ExtendsTagValueNode } from '../ast/php-doc/extends-tag-value-node';
import { GenericTagValueNode } from '../ast/php-doc/generic-tag-value-node';
import { ImplementsTagValueNode } from '../ast/php-doc/implements-tag-value-node';
import { InvalidTagValueNode } from '../ast/php-doc/invalid-tag-value-node';
import { MethodTagValueNode } from '../ast/php-doc/method-tag-value-node';
import { MethodTagValueParameterNode } from '../ast/php-doc/method-tag-value-parameter-node';
import { MixinTagValueNode } from '../ast/php-doc/mixin-tag-value-node';
import { ParamOutTagValueNode } from '../ast/php-doc/param-out-tag-value-node';
import { ParamTagValueNode } from '../ast/php-doc/param-tag-value-node';
import { PhpDocChildNode } from '../ast/php-doc/php-doc-child-node';
import { PhpDocNode } from '../ast/php-doc/php-doc-node';
import { PhpDocTagNode } from '../ast/php-doc/php-doc-tag-node';
import { PhpDocTagValueNode } from '../ast/php-doc/php-doc-tag-value-node';
import { PhpDocTextNode } from '../ast/php-doc/php-doc-text-node';
import { PropertyTagValueNode } from '../ast/php-doc/property-tag-value-node';
import { ReturnTagValueNode } from '../ast/php-doc/return-tag-value-node';
import { SelfOutTagValueNode } from '../ast/php-doc/self-out-tag-value-node';
import { TemplateTagValueNode } from '../ast/php-doc/template-tag-value-node';
import { ThrowsTagValueNode } from '../ast/php-doc/throws-tag-value-node';
import { TypeAliasImportTagValueNode } from '../ast/php-doc/type-alias-import-tag-value-node';
import { TypeAliasTagValueNode } from '../ast/php-doc/type-alias-tag-value-node';
import { TypelessParamTagValueNode } from '../ast/php-doc/typeless-param-tag-value-node';
import { UsesTagValueNode } from '../ast/php-doc/uses-tag-value-node';
import { VarTagValueNode } from '../ast/php-doc/var-tag-value-node';
import { IdentifierTypeNode } from '../ast/type/identifier-type-node';
import { InvalidTypeNode } from '../ast/type/invalid-type-node';
import { TypeNode } from '../ast/type/type-node';
import { Attribute } from '../ast/types';
import { Lexer } from '../lexer/lexer';

const DISALLOWED_DESCRIPTION_START_TOKENS = [
  Lexer.TOKEN_UNION,
  Lexer.TOKEN_INTERSECTION,
];

export class PhpDocParser {
  private useLinesAttributes: boolean;

  private useIndexAttributes: boolean;

  constructor(
    public typeParser: TypeParser,
    public constantExprParser: ConstExprParser,
    public requireWhitespaceBeforeDescription: boolean = false,
    public preserveTypeAliasesWithInvalidTypes: boolean = false,
    usedAttributes: { lines: boolean; indexes: boolean } = {
      lines: false,
      indexes: false,
    },
    public parseDoctrineAnnotations: boolean = false,
  ) {
    this.useLinesAttributes = usedAttributes.lines ?? false;
    this.useIndexAttributes = usedAttributes.indexes ?? false;
  }

  public parse(tokens: TokenIterator): PhpDocNode {
    tokens.consumeTokenType(Lexer.TOKEN_OPEN_PHPDOC);
    tokens.tryConsumeTokenType(Lexer.TOKEN_PHPDOC_EOL);

    const children: PhpDocChildNode[] = [];

    if (!tokens.isCurrentTokenType(Lexer.TOKEN_CLOSE_PHPDOC)) {
      let lastChild = this.parseChild(tokens);
      children.push(lastChild);

      while (!tokens.isCurrentTokenType(Lexer.TOKEN_CLOSE_PHPDOC)) {
        if (
          lastChild instanceof PhpDocTagNode &&
          lastChild.value instanceof GenericTagValueNode
        ) {
          tokens.tryConsumeTokenType(Lexer.TOKEN_PHPDOC_EOL);
          if (tokens.isCurrentTokenType(Lexer.TOKEN_CLOSE_PHPDOC)) {
            break;
          }
          lastChild = this.parseChild(tokens);
          children.push(lastChild);
          // eslint-disable-next-line no-continue
          continue;
        }

        if (!tokens.tryConsumeTokenType(Lexer.TOKEN_PHPDOC_EOL)) {
          break;
        }
        if (tokens.isCurrentTokenType(Lexer.TOKEN_CLOSE_PHPDOC)) {
          break;
        }

        lastChild = this.parseChild(tokens);
        children.push(lastChild);
      }
    }

    tokens.consumeTokenType(Lexer.TOKEN_CLOSE_PHPDOC);

    return new PhpDocNode(children);
  }

  private parseChild(tokens: TokenIterator): PhpDocChildNode {
    if (tokens.isCurrentTokenType(Lexer.TOKEN_PHPDOC_TAG)) {
      return this.parseTag(tokens);
    }

    const text = this.parseText(tokens);
    return text;
  }

  private enrichWithAttributes<T extends BaseNode>(
    tokens: TokenIterator,
    node: T,
    startLine: number,
    startIndex: number,
  ): T {
    if (this.useLinesAttributes) {
      node.setAttribute(Attribute.START_LINE, startLine);
      node.setAttribute(Attribute.END_LINE, tokens.currentTokenLine());
    }

    if (this.useIndexAttributes) {
      node.setAttribute(Attribute.START_INDEX, startIndex);
      node.setAttribute(
        Attribute.END_INDEX,
        tokens.endIndexOfLastRelevantToken(),
      );
    }

    return node;
  }

  private parseText(tokens: TokenIterator): PhpDocTextNode {
    let text = '';

    while (!tokens.isCurrentTokenType(Lexer.TOKEN_PHPDOC_EOL)) {
      text += tokens.getSkippedHorizontalWhiteSpaceIfAny();
      text += tokens.joinUntil(
        Lexer.TOKEN_PHPDOC_EOL,
        Lexer.TOKEN_CLOSE_PHPDOC,
        Lexer.TOKEN_END,
      );

      if (!tokens.isCurrentTokenType(Lexer.TOKEN_PHPDOC_EOL)) {
        break;
      }

      tokens.pushSavePoint();
      tokens.next();

      if (
        tokens.isCurrentTokenType(
          Lexer.TOKEN_PHPDOC_TAG,
          Lexer.TOKEN_PHPDOC_EOL,
          Lexer.TOKEN_CLOSE_PHPDOC,
          Lexer.TOKEN_END,
        )
      ) {
        tokens.rollback();
        break;
      }

      tokens.dropSavePoint();
      text += tokens.getDetectedNewline() ?? '\n';
    }

    return new PhpDocTextNode(text.trim());
  }

  public parseTag(tokens: TokenIterator): PhpDocTagNode {
    const tag = tokens.currentTokenValue();
    tokens.next();
    const value = this.parseTagValue(tokens, tag);

    return new PhpDocTagNode(tag, value);
  }

  public parseTagValue(tokens: TokenIterator, tag: string): PhpDocTagValueNode {
    const startLine = tokens.currentTokenLine();
    const startIndex = tokens.currentTokenIndex();

    let tagValue: BaseNode;
    try {
      tokens.pushSavePoint();

      switch (tag) {
        case '@param':
        case '@phpstan-param':
        case '@psalm-param':
          tagValue = this.parseParamTagValue(tokens);
          break;
        case '@var':
        case '@phpstan-var':
        case '@psalm-var':
          tagValue = this.parseVarTagValue(tokens);
          break;
        case '@return':
        case '@phpstan-return':
        case '@psalm-return':
          tagValue = this.parseReturnTagValue(tokens);
          break;

        case '@throws':
        case '@phpstan-throws':
          tagValue = this.parseThrowsTagValue(tokens);
          break;

        case '@mixin':
          tagValue = this.parseMixinTagValue(tokens);
          break;

        case '@deprecated':
          tagValue = this.parseDeprecatedTagValue(tokens);
          break;

        case '@property':
        case '@property-read':
        case '@property-write':
        case '@phpstan-property':
        case '@phpstan-property-read':
        case '@phpstan-property-write':
        case '@psalm-property':
        case '@psalm-property-read':
        case '@psalm-property-write':
          tagValue = this.parsePropertyTagValue(tokens);
          break;

        case '@method':
        case '@phpstan-method':
        case '@psalm-method':
          tagValue = this.parseMethodTagValue(tokens);
          break;

        case '@template':
        case '@phpstan-template':
        case '@psalm-template':
        case '@template-covariant':
        case '@phpstan-template-covariant':
        case '@psalm-template-covariant':
        case '@template-contravariant':
        case '@phpstan-template-contravariant':
        case '@psalm-template-contravariant':
          tagValue = this.parseTemplateTagValue(tokens, true);
          break;

        case '@extends':
        case '@phpstan-extends':
        case '@template-extends':
          tagValue = this.parseExtendsTagValue('@extends', tokens);
          break;

        case '@implements':
        case '@phpstan-implements':
        case '@template-implements':
          tagValue = this.parseExtendsTagValue('@implements', tokens);
          break;

        case '@use':
        case '@phpstan-use':
        case '@template-use':
          tagValue = this.parseExtendsTagValue('@use', tokens);
          break;

        case '@phpstan-type':
        case '@psalm-type':
          tagValue = this.parseTypeAliasTagValue(tokens);
          break;

        case '@phpstan-import-type':
        case '@psalm-import-type':
          tagValue = this.parseTypeAliasImportTagValue(tokens);
          break;

        case '@phpstan-assert':
        case '@phpstan-assert-if-true':
        case '@phpstan-assert-if-false':
        case '@psalm-assert':
        case '@psalm-assert-if-true':
        case '@psalm-assert-if-false':
          tagValue = this.parseAssertTagValue(tokens);
          break;

        case '@phpstan-this-out':
        case '@phpstan-self-out':
        case '@psalm-this-out':
        case '@psalm-self-out':
          tagValue = this.parseSelfOutTagValue(tokens);
          break;

        case '@param-out':
        case '@phpstan-param-out':
        case '@psalm-param-out':
          tagValue = this.parseParamOutTagValue(tokens);
          break;

        default:
          tagValue = new GenericTagValueNode(
            this.parseOptionalDescription(tokens),
          );
          break;
      }

      tokens.dropSavePoint();
    } catch (e) {
      tokens.rollback();
      return new InvalidTagValueNode(
        this.parseOptionalDescription(tokens),
        e as ParserException,
      );
    }

    return this.enrichWithAttributes(tokens, tagValue, startLine, startIndex);
  }

  private parseParamTagValue(
    tokens: TokenIterator,
  ): ParamTagValueNode | TypelessParamTagValueNode {
    let type: TypeNode | null = null;
    if (
      !tokens.isCurrentTokenType(
        Lexer.TOKEN_REFERENCE,
        Lexer.TOKEN_VARIADIC,
        Lexer.TOKEN_VARIABLE,
      )
    ) {
      type = this.typeParser.parse(tokens);
    }

    const isReference = tokens.tryConsumeTokenType(Lexer.TOKEN_REFERENCE);
    const isVariadic = tokens.tryConsumeTokenType(Lexer.TOKEN_VARIADIC);
    const name = this.parseRequiredVariableName(tokens);
    const description = this.parseOptionalDescription(tokens);

    if (type !== null) {
      return new ParamTagValueNode(
        type,
        isVariadic,
        name,
        description,
        isReference,
      );
    }
    return new TypelessParamTagValueNode(
      isVariadic,
      name,
      description,
      isReference,
    );
  }

  private parseVarTagValue(tokens: TokenIterator): VarTagValueNode {
    const type = this.typeParser.parse(tokens);
    const name = this.parseOptionalVariableName(tokens);
    const description = this.parseOptionalDescription(tokens, name === '');

    return new VarTagValueNode(type, name, description);
  }

  private parseReturnTagValue(tokens: TokenIterator): ReturnTagValueNode {
    const type = this.typeParser.parse(tokens);
    const description = this.parseOptionalDescription(tokens, true);

    return new ReturnTagValueNode(type, description);
  }

  private parseThrowsTagValue(tokens: TokenIterator): ThrowsTagValueNode {
    const type = this.typeParser.parse(tokens);
    const description = this.parseOptionalDescription(tokens, true);

    return new ThrowsTagValueNode(type, description);
  }

  private parseMixinTagValue(tokens: TokenIterator): MixinTagValueNode {
    const type = this.typeParser.parse(tokens);
    const description = this.parseOptionalDescription(tokens, true);

    return new MixinTagValueNode(type, description);
  }

  private parseDeprecatedTagValue(
    tokens: TokenIterator,
  ): DeprecatedTagValueNode {
    const description = this.parseOptionalDescription(tokens);

    return new DeprecatedTagValueNode(description);
  }

  private parsePropertyTagValue(tokens: TokenIterator): PropertyTagValueNode {
    const type = this.typeParser.parse(tokens);
    const name = this.parseRequiredVariableName(tokens);
    const description = this.parseOptionalDescription(tokens);

    return new PropertyTagValueNode(type, name, description);
  }

  private parseMethodTagValue(tokens: TokenIterator): MethodTagValueNode {
    let isStatic = tokens.tryConsumeTokenValue('static');

    let startLine = tokens.currentTokenLine();
    let startIndex = tokens.currentTokenIndex();

    const returnTypeOrName = this.typeParser.parse(tokens);
    let returnType: TypeNode;
    let name: string;

    if (tokens.isCurrentTokenType(Lexer.TOKEN_IDENTIFIER)) {
      returnType = returnTypeOrName;
      name = tokens.currentTokenValue();
      tokens.next();
    } else if (returnTypeOrName instanceof IdentifierTypeNode) {
      returnType = isStatic
        ? this.typeParser.enrichWithAttributes(
            tokens,
            new IdentifierTypeNode('static'),
            startLine,
            startIndex,
          )
        : null;
      name = returnTypeOrName.name;
      isStatic = false;
    } else {
      tokens.consumeTokenType(Lexer.TOKEN_IDENTIFIER); // will throw
    }

    const templateTypes: TemplateTagValueNode[] = [];

    if (tokens.tryConsumeTokenType(Lexer.TOKEN_OPEN_ANGLE_BRACKET)) {
      do {
        startLine = tokens.currentTokenLine();
        startIndex = tokens.currentTokenIndex();
        const templateType = this.parseTemplateTagValue(tokens, false);
        templateTypes.push(
          this.enrichWithAttributes(
            tokens,
            templateType,
            startLine,
            startIndex,
          ),
        );
      } while (tokens.tryConsumeTokenType(Lexer.TOKEN_COMMA));

      tokens.consumeTokenType(Lexer.TOKEN_CLOSE_ANGLE_BRACKET);
    }

    const parameters: MethodTagValueParameterNode[] = [];
    tokens.consumeTokenType(Lexer.TOKEN_OPEN_PARENTHESES);

    if (!tokens.isCurrentTokenType(Lexer.TOKEN_CLOSE_PARENTHESES)) {
      const parameter = this.parseMethodTagValueParameter(tokens);
      parameters.push(parameter);

      while (tokens.tryConsumeTokenType(Lexer.TOKEN_COMMA)) {
        parameters.push(this.parseMethodTagValueParameter(tokens));
      }
    }

    tokens.consumeTokenType(Lexer.TOKEN_CLOSE_PARENTHESES);

    const description = this.parseOptionalDescription(tokens);

    return new MethodTagValueNode(
      isStatic,
      returnType,
      name,
      parameters,
      description,
      templateTypes,
    );
  }

  private parseMethodTagValueParameter(
    tokens: TokenIterator,
  ): MethodTagValueParameterNode {
    const startLine = tokens.currentTokenLine();
    const startIndex = tokens.currentTokenIndex();

    let type: TypeNode | null = null;

    switch (tokens.currentTokenType()) {
      case Lexer.TOKEN_IDENTIFIER:
      case Lexer.TOKEN_OPEN_PARENTHESES:
      case Lexer.TOKEN_NULLABLE:
        type = this.typeParser.parse(tokens);
        break;

      default:
        type = null;
    }

    const isReference = tokens.tryConsumeTokenType(Lexer.TOKEN_REFERENCE);
    const isVariadic = tokens.tryConsumeTokenType(Lexer.TOKEN_VARIADIC);

    const name = tokens.currentTokenValue();
    tokens.consumeTokenType(Lexer.TOKEN_VARIABLE);

    let defaultValue: ConstExprNode | null = null;
    if (tokens.tryConsumeTokenType(Lexer.TOKEN_EQUAL)) {
      defaultValue = this.constantExprParser.parse(tokens);
    }

    return this.enrichWithAttributes(
      tokens,
      new MethodTagValueParameterNode(
        type,
        isReference,
        isVariadic,
        name,
        defaultValue,
      ),
      startLine,
      startIndex,
    );
  }

  private parseTemplateTagValue(
    tokens: TokenIterator,
    parseDescription: boolean,
  ): TemplateTagValueNode {
    const name = tokens.currentTokenValue();
    tokens.consumeTokenType(Lexer.TOKEN_IDENTIFIER);

    let bound: TypeNode | null = null;
    if (
      tokens.tryConsumeTokenValue('of') ||
      tokens.tryConsumeTokenValue('as')
    ) {
      bound = this.typeParser.parse(tokens);
    }

    let defaultValue: TypeNode | null = null;
    if (tokens.tryConsumeTokenValue('=')) {
      defaultValue = this.typeParser.parse(tokens);
    }

    let description = '';
    if (parseDescription) {
      description = this.parseOptionalDescription(tokens);
    }

    return new TemplateTagValueNode(name, bound, description, defaultValue);
  }

  private parseExtendsTagValue(
    tagName: string,
    tokens: TokenIterator,
  ): PhpDocTagValueNode {
    const startLine = tokens.currentTokenLine();
    const startIndex = tokens.currentTokenIndex();

    const baseType = new IdentifierTypeNode(tokens.currentTokenValue());
    tokens.consumeTokenType(Lexer.TOKEN_IDENTIFIER);

    const type = this.typeParser.parseGeneric(
      tokens,
      this.enrichWithAttributes(tokens, baseType, startLine, startIndex),
    );

    const description = this.parseOptionalDescription(tokens);

    switch (tagName) {
      case '@extends':
        return new ExtendsTagValueNode(type, description);
      case '@implements':
        return new ImplementsTagValueNode(type, description);
      case '@use':
        return new UsesTagValueNode(type, description);
      default:
        throw new Error('Should not happen');
    }
  }

  private parseTypeAliasTagValue(tokens: TokenIterator): TypeAliasTagValueNode {
    const alias = tokens.currentTokenValue();
    tokens.consumeTokenType(Lexer.TOKEN_IDENTIFIER);

    // support psalm-type syntax
    tokens.tryConsumeTokenType(Lexer.TOKEN_EQUAL);

    if (this.preserveTypeAliasesWithInvalidTypes) {
      const startLine = tokens.currentTokenLine();
      const startIndex = tokens.currentTokenIndex();

      try {
        const type = this.typeParser.parse(tokens);
        if (!tokens.isCurrentTokenType(Lexer.TOKEN_CLOSE_PHPDOC)) {
          if (!tokens.isCurrentTokenType(Lexer.TOKEN_PHPDOC_EOL)) {
            throw new Error('Expected end of line');
          }
        }
        return new TypeAliasTagValueNode(alias, type);
      } catch (e) {
        this.parseOptionalDescription(tokens);
        return new TypeAliasTagValueNode(
          alias,
          this.enrichWithAttributes(
            tokens,
            new InvalidTypeNode(e as ParserException),
            startLine,
            startIndex,
          ),
        );
      }
    }

    const type = this.typeParser.parse(tokens);
    return new TypeAliasTagValueNode(alias, type);
  }

  private parseTypeAliasImportTagValue(
    tokens: TokenIterator,
  ): TypeAliasImportTagValueNode {
    const importedAlias = tokens.currentTokenValue();
    tokens.consumeTokenType(Lexer.TOKEN_IDENTIFIER);

    tokens.consumeTokenValue(Lexer.TOKEN_IDENTIFIER, 'from');

    const identifierStartLine = tokens.currentTokenLine();
    const identifierStartIndex = tokens.currentTokenIndex();
    const importedFrom = tokens.currentTokenValue();
    tokens.consumeTokenType(Lexer.TOKEN_IDENTIFIER);
    const importedFromType = this.enrichWithAttributes(
      tokens,
      new IdentifierTypeNode(importedFrom),
      identifierStartLine,
      identifierStartIndex,
    );

    let importedAs: string | null = null;
    if (tokens.tryConsumeTokenValue('as')) {
      importedAs = tokens.currentTokenValue();
      tokens.consumeTokenType(Lexer.TOKEN_IDENTIFIER);
    }

    return new TypeAliasImportTagValueNode(
      importedAlias,
      importedFromType,
      importedAs,
    );
  }

  private parseAssertTagValue(
    tokens: TokenIterator,
  ):
    | AssertTagValueNode
    | AssertTagPropertyValueNode
    | AssertTagMethodValueNode {
    const isNegated = tokens.tryConsumeTokenType(Lexer.TOKEN_NEGATED);
    const isEquality = tokens.tryConsumeTokenType(Lexer.TOKEN_EQUAL);

    const type = this.typeParser.parse(tokens);

    const parameter = this.parseAssertParameter(tokens);

    const description = this.parseOptionalDescription(tokens);

    if (parameter.method) {
      return new AssertTagMethodValueNode(
        type,
        parameter.parameter,
        parameter.method,
        isNegated,
        description,
        isEquality,
      );
    }
    if (parameter.property) {
      return new AssertTagPropertyValueNode(
        type,
        parameter.parameter,
        parameter.property,
        isNegated,
        description,
        isEquality,
      );
    }

    return new AssertTagValueNode(
      type,
      parameter.parameter,
      isNegated,
      description,
      isEquality,
    );
  }

  private parseAssertParameter(tokens: TokenIterator): {
    parameter: string;
    property?: string;
    method?: string;
  } {
    let parameter: string;
    let requirePropertyOrMethod: boolean;
    if (tokens.isCurrentTokenType(Lexer.TOKEN_THIS_VARIABLE)) {
      parameter = '$this';
      requirePropertyOrMethod = true;
      tokens.next();
    } else {
      parameter = tokens.currentTokenValue();
      requirePropertyOrMethod = false;
      tokens.consumeTokenType(Lexer.TOKEN_VARIABLE);
    }

    if (
      requirePropertyOrMethod ||
      tokens.isCurrentTokenType(Lexer.TOKEN_ARROW)
    ) {
      tokens.consumeTokenType(Lexer.TOKEN_ARROW);

      const name = tokens.currentTokenValue();
      tokens.consumeTokenType(Lexer.TOKEN_IDENTIFIER);

      if (tokens.tryConsumeTokenType(Lexer.TOKEN_OPEN_PARENTHESES)) {
        tokens.consumeTokenType(Lexer.TOKEN_CLOSE_PARENTHESES);
        return {
          parameter,
          method: name,
        };
      }

      return {
        parameter,
        property: name,
      };
    }

    return { parameter };
  }

  private parseSelfOutTagValue(tokens: TokenIterator): SelfOutTagValueNode {
    const type = this.typeParser.parse(tokens);
    const description = this.parseOptionalDescription(tokens);

    return new SelfOutTagValueNode(type, description);
  }

  private parseParamOutTagValue(tokens: TokenIterator): ParamOutTagValueNode {
    const type = this.typeParser.parse(tokens);
    const name = this.parseRequiredVariableName(tokens);
    const description = this.parseOptionalDescription(tokens);

    return new ParamOutTagValueNode(type, name, description);
  }

  private parseOptionalVariableName(tokens: TokenIterator): string {
    if (tokens.isCurrentTokenType(Lexer.TOKEN_VARIABLE)) {
      const name = tokens.currentTokenValue();
      tokens.next();
      return name;
    }
    if (tokens.isCurrentTokenType(Lexer.TOKEN_THIS_VARIABLE)) {
      const name = '$this';
      tokens.next();
      return name;
    }
    return '';
  }

  private parseRequiredVariableName(tokens: TokenIterator): string {
    const name = tokens.currentTokenValue();
    tokens.consumeTokenType(Lexer.TOKEN_VARIABLE);
    return name;
  }

  private parseOptionalDescription(
    tokens: TokenIterator,
    limitStartToken = false,
  ): string {
    if (limitStartToken) {
      for (const token of DISALLOWED_DESCRIPTION_START_TOKENS) {
        if (!tokens.isCurrentTokenType(token)) {
          // eslint-disable-next-line no-continue
          continue;
        }
        tokens.consumeTokenType(Lexer.TOKEN_OTHER); // will throw
      }

      if (
        this.requireWhitespaceBeforeDescription &&
        !tokens.isCurrentTokenType(
          Lexer.TOKEN_PHPDOC_EOL,
          Lexer.TOKEN_CLOSE_PHPDOC,
          Lexer.TOKEN_END,
        ) &&
        !tokens.isPrecededByHorizontalWhitespace()
      ) {
        tokens.consumeTokenType(Lexer.TOKEN_HORIZONTAL_WS); // will throw
      }
    }

    return this.parseText(tokens).text;
  }
}

import { ParserException } from '../../parser/parser-exception';
import { PhpDocTagValueNode } from './php-doc-tag-value-node';

export class InvalidTagValueNode extends PhpDocTagValueNode {
  private exceptionArgs: ConstructorParameters<typeof ParserException>;

  constructor(
    public value: string,
    exception: ParserException,
  ) {
    super();
    this.exceptionArgs = [
      exception.getCurrentTokenValue(),
      exception.getCurrentTokenType(),
      exception.getCurrentOffset(),
      exception.getExpectedTokenType(),
      exception.getExpectedTokenValue(),
      exception.getCurrentTokenLine(),
    ];
  }

  public get(name: string): ParserException {
    if (name !== 'exception') {
      // eslint-disable-next-line no-console
      console.warn(`Undefined property: InvalidTagValueNode::$${name}`);
      return null;
    }

    return new ParserException(...this.exceptionArgs);
  }

  public toString(): string {
    return this.value;
  }

  public getNodeType(): string {
    return 'InvalidTagValueNode';
  }
}

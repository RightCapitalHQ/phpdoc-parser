import { TypeNode } from './type-node';
import { ParserException } from '../../parser/parser-exception';

export class InvalidTypeNode extends TypeNode {
  public exceptionArgs: ConstructorParameters<typeof ParserException>;

  constructor(public exception: ParserException) {
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

  public getException(): ParserException {
    return new ParserException(...this.exceptionArgs);
  }

  public toString(): string {
    return '*Invalid type*';
  }

  public getNodeType(): string {
    return 'InvalidTypeNode';
  }
}

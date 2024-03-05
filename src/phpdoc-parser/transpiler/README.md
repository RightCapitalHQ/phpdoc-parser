```TypeScript
import { renderTsNodeToString } from './helpers';
import {
  type NameNodePathResolver,
  PhpDocTypeNodeToTypescriptTypeNodeTranspiler,
} from './php-doc-to-typescript-type-transpiler';
import type { ParamTagValueNode } from '../ast/php-doc/param-tag-value-node';
import type { PropertyTagValueNode } from '../ast/php-doc/property-tag-value-node';
import type { ReturnTagValueNode } from '../ast/php-doc/return-tag-value-node';
import { Lexer } from '../lexer/lexer';
import { ConstExprParser } from '../parser/const-expr-parser';
import { PhpDocParser } from '../parser/php-doc-parser';
import { TokenIterator } from '../parser/token-iterator';
import { TypeParser } from '../parser/type-parser';

class ExtendedTranspiler extends PhpDocTypeNodeToTypescriptTypeNodeTranspiler {
  public isSnakeCase: boolean = true;

  constructor(public resolver: NameNodePathResolver<ExtendedTranspiler>) {
    super(
      (nodeParts: string[]) =>
        resolver.call(this, nodeParts) as {
          path: string;
          name: string;
          isTypeOnly: boolean;
        },
    );
  }
}

const transpileCommentText = (commentText: string) => {
  const lexer = new Lexer();
  const constExprParser = new ConstExprParser();
  const typeParser = new TypeParser(constExprParser);
  const phpDocParser = new PhpDocParser(typeParser, constExprParser);

  const tokens = new TokenIterator(lexer.tokenize(commentText));
  const astRootNode = phpDocParser.parse(tokens); // PhpDocNode
  const propertyTagValueNodes = astRootNode
    .getTags()
    .map((node) => node.value) as (
    | PropertyTagValueNode
    | ReturnTagValueNode
    | ParamTagValueNode
  )[];

  return propertyTagValueNodes;
};

const shortText = `/**
* @property-read  array|null                        $person
*/`;

const tsTypeNode = transpileCommentText(shortText);

const nameNodePathResolver: NameNodePathResolver<ExtendedTranspiler> =
  // eslint-disable-next-line func-names
  function (this: ExtendedTranspiler, nodeParts: string[]) {
    console.log(
      'here ',
      `${nodeParts.length} ${this.isSnakeCase ? 'yes' : 'no'}`,
    );

    return {
      name: '',
      path: '',
      isTypeOnly: false,
    };
  };

tsTypeNode.map((node) => {
  const transpiler = new ExtendedTranspiler(nameNodePathResolver);
  transpiler.isSnakeCase = false;
  transpiler.beforeTranspile();
  const transpiledNode = transpiler.transpile(node.type);

  return renderTsNodeToString(transpiledNode);
});

```

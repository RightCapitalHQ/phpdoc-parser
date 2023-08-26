import { Lexer } from '../../src';

const commonSource = `
/**
 * @property float|null $cash_balance
 * @property-read string|null         $default_name
 * @property-read int|null            $refresh_code
 * @property-read \\Carbon\\Carbon|null $refreshed_at
 * @property-read string|null         $refreshed_at_friendly
 * @property-read int                 $signed_balance
 * @property-read int|null            $tax_advantage_id
 * @property-read float               $total_cost_basis total cost to buy, both stocks and funds
 * @property-read float               $total_value      total market value + signed cash balance
 *
 * @method static \\Illuminate\\Database\\Eloquent\\Builder included()
 */
`.trim();

it('test tokenize for a very common doc annotation', () => {
  const lexer = new Lexer();
  const tokens = lexer.tokenize(commonSource);
  expect(tokens).toMatchSnapshot('commonSource');
});

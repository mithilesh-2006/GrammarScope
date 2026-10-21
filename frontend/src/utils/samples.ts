export interface GrammarPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  grammar: string;
  startSymbol: string;
  sampleInput: string;
  isAmbiguous: boolean;
}

export const SAMPLE_GRAMMARS: GrammarPreset[] = [
  {
    id: 'ambiguous-arithmetic',
    name: 'Ambiguous Arithmetic Expressions',
    category: 'Ambiguity Classic',
    description: 'Classic textbook ambiguous grammar without operator precedence or associativity.',
    grammar: `E -> E + E | E * E | ( E ) | id`,
    startSymbol: 'E',
    sampleInput: 'id + id * id',
    isAmbiguous: true,
  },
  {
    id: 'unambiguous-arithmetic',
    name: 'Unambiguous Precedence Grammar',
    category: 'Unambiguous Standard',
    description: 'Enforces multiplication precedence over addition and left-associativity.',
    grammar: `E -> E + T | T
T -> T * F | F
F -> ( E ) | id`,
    startSymbol: 'E',
    sampleInput: 'id + id * id',
    isAmbiguous: false,
  },
  {
    id: 'dangling-else',
    name: 'Dangling Else Ambiguity',
    category: 'Control Flow',
    description: 'Famous compiler ambiguity where an else clause can bind to either inner or outer if.',
    grammar: `S -> if cond then S else S | if cond then S | stmt`,
    startSymbol: 'S',
    sampleInput: 'if cond then if cond then stmt else stmt',
    isAmbiguous: true,
  },
  {
    id: 'balanced-parentheses',
    name: 'Balanced Parentheses with Epsilon',
    category: 'Formal Languages',
    description: 'Generates properly nested parentheses and brackets, including empty string.',
    grammar: `S -> ( S ) S | [ S ] S | ε`,
    startSymbol: 'S',
    sampleInput: '( ) [ ( ) ]',
    isAmbiguous: false,
  },
  {
    id: 'left-recursive',
    name: 'Left-Recursive Chain',
    category: 'Recursion',
    description: 'Demonstrates handling of direct left recursion without infinite loops.',
    grammar: `S -> S a | b`,
    startSymbol: 'S',
    sampleInput: 'b a a a',
    isAmbiguous: false,
  },
];

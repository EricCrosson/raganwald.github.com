console.log('01-evaluating-regular-expressions.js')

function error(m) {
  console.log(m);
  throw m;
}

const arithmetic = {
  operators: {
    '+': {
      symbol: Symbol('+'),
      type: 'infix',
      precedence: 1,
      fn: (a, b) => a + b
    },
    '-': {
      symbol: Symbol('-'),
      type: 'infix',
      precedence: 1,
      fn: (a, b) => a - b
    },
    '*': {
      symbol: Symbol('*'),
      type: 'infix',
      precedence: 3,
      fn: (a, b) => a * b
    },
    '/': {
      symbol: Symbol('/'),
      type: 'infix',
      precedence: 2,
      fn: (a, b) => a / b
    },
    '!': {
      symbol: Symbol('!'),
      type: 'postfix',
      precedence: 4,
      fn: function factorial(a, memo = 1) {
        if (a < 2) {
          return a * memo;
        } else {
          return factorial(a - 1, a * memo);
        }
      }
    }
  }
};

function peek(stack) {
  return stack[stack.length - 1];
}

function shuntingYardFirstCut(infixExpression, {
  operators
}) {
  const operatorsMap = new Map(
    Object.entries(operators)
  );

  const representationOf =
    something => {
      if (operatorsMap.has(something)) {
        const {
          symbol
        } = operatorsMap.get(something);

        return symbol;
      } else if (typeof something === 'string') {
        return something;
      } else {
        error(`${something} is not a value`);
      }
    };
  const typeOf =
    symbol => operatorsMap.has(symbol) ? operatorsMap.get(symbol).type : 'value';
  const isInfix =
    symbol => typeOf(symbol) === 'infix';
  const isPostfix =
    symbol => typeOf(symbol) === 'postfix';
  const isCombinator =
    symbol => isInfix(symbol) || isPostfix(symbol);

  const input = infixExpression.split('');
  const operatorStack = [];
  const reversePolishRepresentation = [];
  let awaitingValue = true;

  while (input.length > 0) {
    const symbol = input.shift();

    if (symbol === '(' && awaitingValue) {
      // opening parenthesis case, going to build
      // a value
      operatorStack.push(symbol);
      awaitingValue = true;
    } else if (symbol === '(') {
      // value catenation
      error(`values ${peek(reversePolishRepresentation)} and ${symbol} cannot be catenated`);
    } else if (symbol === ')') {
      // closing parenthesis case, clear the
      // operator stack

      while (operatorStack.length > 0 && peek(operatorStack) !== '(') {
        const op = operatorStack.pop();

        reversePolishRepresentation.push(representationOf(op));
      }

      if (peek(operatorStack) === '(') {
        operatorStack.pop();
        awaitingValue = false;
      } else {
        error('Unbalanced parentheses');
      }
    } else if (isCombinator(symbol)) {
      const {
        precedence
      } = operatorsMap.get(symbol);

      // pop higher-precedence operators off the operator stack
      while (isCombinator(symbol) && operatorStack.length > 0 && peek(operatorStack) !== '(') {
        const opPrecedence = operatorsMap.get(peek(operatorStack)).precedence;

        if (precedence < opPrecedence) {
          const op = operatorStack.pop();

          reversePolishRepresentation.push(representationOf(op));
        } else {
          break;
        }
      }

      operatorStack.push(symbol);
      awaitingValue = isInfix(symbol);
    } else if (awaitingValue) {
      // as expected, go straight to the output

      reversePolishRepresentation.push(representationOf(symbol));
      awaitingValue = false;
    } else {
      // value catenation
      error(`values ${peek(reversePolishRepresentation)} and ${symbol} cannot be catenated`);
    }
  }

  // pop remaining symbols off the stack and push them
  while (operatorStack.length > 0) {
    const op = operatorStack.pop();

    if (operatorsMap.has(op)) {
      const {
        symbol: opSymbol
      } = operatorsMap.get(op);
      reversePolishRepresentation.push(opSymbol);
    } else {
      error(`Don't know how to push operator ${op}`);
    }
  }

  return reversePolishRepresentation;
}

function shuntingYardSecondCut(infixExpression, {
  operators,
  defaultOperator
}) {
  const operatorsMap = new Map(
    Object.entries(operators)
  );

  const representationOf =
    something => {
      if (operatorsMap.has(something)) {
        const {
          symbol
        } = operatorsMap.get(something);

        return symbol;
      } else if (typeof something === 'string') {
        return something;
      } else {
        error(`${something} is not a value`);
      }
    };
  const typeOf =
    symbol => operatorsMap.has(symbol) ? operatorsMap.get(symbol).type : 'value';
  const isInfix =
    symbol => typeOf(symbol) === 'infix';
  const isPrefix =
    symbol => typeOf(symbol) === 'prefix';
  const isPostfix =
    symbol => typeOf(symbol) === 'postfix';
  const isCombinator =
    symbol => isInfix(symbol) || isPrefix(symbol) || isPostfix(symbol);
  const awaitsValue =
    symbol => isInfix(symbol) || isPrefix(symbol);

  const input = infixExpression.split('');
  const operatorStack = [];
  const reversePolishRepresentation = [];
  let awaitingValue = true;

  while (input.length > 0) {
    const symbol = input.shift();

    if (symbol === '(' && awaitingValue) {
      // opening parenthesis case, going to build
      // a value
      operatorStack.push(symbol);
      awaitingValue = true;
    } else if (symbol === '(') {
      // value catenation

      input.unshift(symbol);
      input.unshift(defaultOperator);
      awaitingValue = false;
    } else if (symbol === ')') {
      // closing parenthesis case, clear the
      // operator stack

      while (operatorStack.length > 0 && peek(operatorStack) !== '(') {
        const op = operatorStack.pop();

        reversePolishRepresentation.push(representationOf(op));
      }

      if (peek(operatorStack) === '(') {
        operatorStack.pop();
        awaitingValue = false;
      } else {
        error('Unbalanced parentheses');
      }
    } else if (isPrefix(symbol)) {
      if (awaitingValue) {
        const { precedence } = operatorsMap.get(symbol);

        // pop higher-precedence operators off the operator stack
        while (isCombinator(symbol) && operatorStack.length > 0 && peek(operatorStack) !== '(') {
          const opPrecedence = operatorsMap.get(peek(operatorStack)).precedence;

          if (precedence < opPrecedence) {
            const op = operatorStack.pop();

            reversePolishRepresentation.push(representationOf(op));
          } else {
            break;
          }
        }

        operatorStack.push(symbol);
        awaitingValue = awaitsValue(symbol);
      } else {
        // value catenation

        input.unshift(symbol);
        input.unshift(defaultOperator);
        awaitingValue = false;
      }
    } else if (isCombinator(symbol)) {
      const {
        precedence
      } = operatorsMap.get(symbol);

      // pop higher-precedence operators off the operator stack
      while (isCombinator(symbol) && operatorStack.length > 0 && peek(operatorStack) !== '(') {
        const opPrecedence = operatorsMap.get(peek(operatorStack)).precedence;

        if (precedence < opPrecedence) {
          const op = operatorStack.pop();

          reversePolishRepresentation.push(representationOf(op));
        } else {
          break;
        }
      }

      operatorStack.push(symbol);
      awaitingValue = awaitsValue(symbol);
    } else if (awaitingValue) {
      // as expected, go straight to the output

      reversePolishRepresentation.push(representationOf(symbol));
      awaitingValue = false;
    } else {
      // value catenation

      input.unshift(symbol);
      input.unshift(defaultOperator);
      awaitingValue = false;
    }
  }

  // pop remaining symbols off the stack and push them
  while (operatorStack.length > 0) {
    const op = operatorStack.pop();

    if (operatorsMap.has(op)) {
      const {
        symbol: opSymbol
      } = operatorsMap.get(op);
      reversePolishRepresentation.push(opSymbol);
    } else {
      error(`Don't know how to push operator ${op}`);
    }
  }

  return reversePolishRepresentation;
}

function deepEqual(obj1, obj2) {
  function isPrimitive(obj) {
    return (obj !== Object(obj));
  }

  if (obj1 === obj2) // it's just the same object. No need to compare.
    return true;

  if (isPrimitive(obj1) && isPrimitive(obj2)) // compare primitives
    return obj1 === obj2;

  if (Object.keys(obj1).length !== Object.keys(obj2).length)
    return false;

  // compare objects with same number of keys
  for (let key in obj1) {
    if (!(key in obj2)) return false; //other object doesn't have this prop
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }

  return true;
}

const pp = value => value instanceof Array ? value.map(x => x.toString()) : value;

function verify(fn, tests, ...additionalArgs) {
  try {
    const testList =
      typeof tests.entries === 'function'
        ? [...tests.entries()]
        : Object.entries(tests);
    const numberOfTests = testList.length;

    const outcomes = testList.map(
      ([example, expected]) => {
        const actual = fn(example, ...additionalArgs);

        if (deepEqual(actual, expected)) {
          return 'pass';
        } else {
          return `fail: ${JSON.stringify({ example, expected: pp(expected), actual: pp(actual) })}`;
        }
      }
    )

    const failures = outcomes.filter(result => result !== 'pass');
    const numberOfFailures = failures.length;
    const numberOfPasses = numberOfTests - numberOfFailures;

    if (numberOfFailures === 0) {
      console.log(`All ${numberOfPasses} tests passing`);
    } else {
      console.log(`${numberOfFailures} tests failing: ${failures.join('; ')}`);
    }
  } catch (error) {
    console.log(`Failed to validate: ${error}`)
  }
}

function stateMachine (representationList, {
  operators,
  toValue
}) {
  const functions = new Map(
    Object.entries(operators).map(
      ([key, { symbol, fn }]) => [symbol, fn]
    )
  );

  const stack = [];

  for (const element of representationList) {
    if (typeof element === 'string') {
      stack.push(toValue(element));
    } else if (functions.has(element)) {
      const fn = functions.get(element);
      const arity = fn.length;

      if (stack.length < arity) {
        error(`Not enough values on the stack to use ${element}`)
      } else {
        const args = [];

        for (let counter = 0; counter < arity; ++counter) {
          args.unshift(stack.pop());
        }

        stack.push(fn.apply(null, args))
      }
    } else {
      error(`Don't know what to do with ${element}'`)
    }
  }
  if (stack.length === 0) {
    return undefined;
  } else if (stack.length > 1) {
    error(`should only be one value to return, but there were ${stack.length} values on the stack`);
  } else {
    return stack[0];
  }
}

function evaluateFirstCut(expression, definition) {
  return stateMachine(
    shuntingYardSecondCut(
      expression, definition
    ),
    definition
  );
}

// ----------

verify(shuntingYardFirstCut, {
  '3': ['3'],
  '2+3': ['2', '3', arithmetic.operators['+'].symbol],
  '4!': ['4', arithmetic.operators['!'].symbol],
  '3*2+4!': ['3', '2', arithmetic.operators['*'].symbol, '4', arithmetic.operators['!'].symbol, arithmetic.operators['+'].symbol],
  '(3*2+4)!': ['3', '2', arithmetic.operators['*'].symbol, '4', arithmetic.operators['+'].symbol, arithmetic.operators['!'].symbol]
}, arithmetic);

const arithmeticB = {
  operators: arithmetic.operators,
  defaultOperator: '*'
};

verify(shuntingYardSecondCut, {
  '3': ['3'],
  '2+3': ['2', '3', arithmetic.operators['+'].symbol],
  '4!': ['4', arithmetic.operators['!'].symbol],
  '3*2+4!': ['3', '2', arithmetic.operators['*'].symbol, '4', arithmetic.operators['!'].symbol, arithmetic.operators['+'].symbol],
  '(3*2+4)!': ['3', '2', arithmetic.operators['*'].symbol, '4', arithmetic.operators['+'].symbol, arithmetic.operators['!'].symbol],
  '2(3+4)5': ['2', '3', '4', arithmeticB.operators['+'].symbol, '5', arithmeticB.operators['*'].symbol, arithmeticB.operators['*'].symbol],
  '3!2': ['3', arithmeticB.operators['!'].symbol, '2', arithmeticB.operators['*'].symbol]
}, arithmeticB);

const arithmeticC = {
  operators: arithmetic.operators,
  defaultOperator: '*',
  toValue: string => Number.parseInt(string, 10)
};

verify(evaluateFirstCut, {
  '': undefined,
  '3': 3,
  '2+3': 5,
  '4!': 24,
  '3*2+4!': 30,
  '(3*2+4)!': 3628800,
  '2(3+4)5': 70,
  '3!2': 12
}, arithmeticC);

console.log('02-finite-state-recognizers.js');

function toStateMap (transitions, allowNFA = false) {
  return transitions
      .reduce(
        (acc, transition) => {
          let {
            from,
            consume,
            to
          } = transition;

          if (from == null) {
            error(
              `Transition ${JSON.stringify(transition)} does not have a from state. ` +
              `This is not allowed.`
            );
          }

          if (consume == null) {
            error(
               `Transition ${JSON.stringify(transition)} does not consume a token. ` +
              `ε-transitions are not allowed.`
            );
          }

          if (to == null) {
            error(
              `Transition ${JSON.stringify(transition)} does not have a to state. ` +
              `This is not allowed.`
            );
          }

          if (!acc.has(from)) {
            acc.set(from, []);
          }

          const existingTransitions = acc.get(from);

          for (const { consume: existingConsume, to: existingTo } of existingTransitions) {
            if (consume === existingConsume && to === existingTo) {
              console.log(
                `Transition ${JSON.stringify(transition)} already exists. ` +
                `Duplicates will be ignored. Please avoid this in future.`
              )
              return acc;
            }
            if (!allowNFA && consume === existingConsume) {
              error(
                `Transition ${JSON.stringify(transition)} creates non-determinism ` +
                `between ${to} and ${existingTo}. ` +
                `This is not allowed.`
              );
            }
          }

          existingTransitions.push(transition);

          return acc;
        },
        new Map()
      );
}

function toAlphabetSet (transitions) {
  return new Set(
    transitions.map(
      ({ consume }) => consume
    )
  )
}

// only handles states in the transition table
function toStateSet (transitions) {
  return new Set(
    transitions.reduce(
      (acc, { from, to }) => {
        acc.add(from);
        acc.add(to);
        return acc;
      },
      new Set()
    )
  )
}

function allStatesFor ({ start, transitions, accepting }) {
  return new Set(
    transitions.reduce(
      (acc, { from, to }) => {
        acc.add(from);
        acc.add(to);
        return acc;
      },
      new Set([start, ...accepting])
    )
  )
}

function validatedAndProcessed ({
  alphabet,
  states,
  start,
  transitions,
  accepting
}, allowNFA = false) {
  const alphabetSet = toAlphabetSet(transitions);
  const stateMap = toStateMap(transitions, allowNFA);
  const stateSet = toStateSet(transitions);
  const acceptingSet = new Set(accepting);
  const allStates = allStatesFor({ start, transitions, accepting });

  // validate alphabet if present
  if (alphabet != null) {
    const declaredAlphabetSet = new Set(alphabet.split(''));

    const undeclaredSymbols =
      [...alphabetSet]
        .filter(
          sym => !declaredAlphabetSet.has(sym)
        )
    	.map(x => `'${x}'`);

    if (undeclaredSymbols.length > 0) {
      error(
        `the symbols ${undeclaredSymbols.join(', ')} are used, but not present in the alphabet`
      );
    }
  } else {
    alphabet = [...alphabetSet].join('');
  }

  // validate states if present
  if (states != null) {
    const declaredStateSet = new Set(states);

    const undeclaredStates =
      [...stateSet]
        .filter(
          state => !declaredStateSet.has(state)
        )
    	.map(x => `'${x}'`);

    if (undeclaredStates.length > 0) {
      error(
        `the states ${undeclaredStates.join(', ')} are used, but not present in the states declaration`
      );
    }

    const unusedStates =
      states
        .filter(
          state => !stateSet.has(state)
        )
    	.map(x => `'${x}'`);

    if (unusedStates.length > 0) {
      error(
        `the states ${unusedStates.join(', ')} are declared, but not used in the transitions`
      );
    }
  } else {
    states = [...stateSet];
  }

  return {
    allStates,
    alphabet,
    alphabetSet,
    states,
    stateSet,
    stateMap,
    start,
    accepting,
    acceptingSet,
    transitions
  };
}

function automate (description) {
  if (description instanceof RegExp) {
    return string => !!description.exec(string)
  } else {
    const {
      stateMap,
      start,
      acceptingSet,
      transitions
    } = validatedAndProcessed(description);

    return function (input) {
      let state = start;

      for (const symbol of input) {
        const transitionsForThisState = stateMap.get(state) || [];
        const transition =
        	transitionsForThisState.find(
            ({ consume }) => consume === symbol
        	);

        if (transition == null) {
          return false;
        }

        state = transition.to;
      }

      // reached the end. do we accept?
      return acceptingSet.has(state);
    }
  }
}

function verifyRecognizer (recognizer, examples) {
  return verify(automate(recognizer), examples);
}

// ----------

const binary = {
  "start": "start",
  "transitions": [
    { "from": "start", "consume": "0", "to": "zero" },
    { "from": "start", "consume": "1", "to": "notZero" },
    { "from": "notZero", "consume": "0", "to": "notZero" },
    { "from": "notZero", "consume": "1", "to": "notZero" }
  ],
  "accepting": ["zero", "notZero"]
};

verifyRecognizer(binary, {
  '': false,
  '0': true,
  '1': true,
  '00': false,
  '01': false,
  '10': true,
  '11': true,
  '000': false,
  '001': false,
  '010': false,
  '011': false,
  '100': true,
  '101': true,
  '110': true,
  '111': true,
  '10100011011000001010011100101110111': true
});

const reg = {
  "start": "empty",
  "accepting": ["reg"],
  "transitions": [
    { "from": "empty", "consume": "r", "to": "r" },
    { "from": "empty", "consume": "R", "to": "r" },
    { "from": "r", "consume": "e", "to": "re" },
    { "from": "r", "consume": "E", "to": "re" },
    { "from": "re", "consume": "g", "to": "reg" },
    { "from": "re", "consume": "G", "to": "reg" }
  ]
};

verifyRecognizer(reg, {
  '': false,
  'r': false,
  'R': false,
  'Reg': true,
  'REG': true,
  'Reginald': false,
  'REGINALD': false
});

const uppercase = {
  "start": "uppercase",
  "accepting": ["uppercase"],
  "transitions": [
    { "from": "uppercase", "consume": "A", "to": "uppercase" },
    { "from": "uppercase", "consume": "B", "to": "uppercase" },
    { "from": "uppercase", "consume": "C", "to": "uppercase" },
    { "from": "uppercase", "consume": "D", "to": "uppercase" },
    { "from": "uppercase", "consume": "E", "to": "uppercase" },
    { "from": "uppercase", "consume": "F", "to": "uppercase" },
    { "from": "uppercase", "consume": "G", "to": "uppercase" },
    { "from": "uppercase", "consume": "H", "to": "uppercase" },
    { "from": "uppercase", "consume": "I", "to": "uppercase" },
    { "from": "uppercase", "consume": "J", "to": "uppercase" },
    { "from": "uppercase", "consume": "K", "to": "uppercase" },
    { "from": "uppercase", "consume": "L", "to": "uppercase" },
    { "from": "uppercase", "consume": "M", "to": "uppercase" },
    { "from": "uppercase", "consume": "N", "to": "uppercase" },
    { "from": "uppercase", "consume": "O", "to": "uppercase" },
    { "from": "uppercase", "consume": "P", "to": "uppercase" },
    { "from": "uppercase", "consume": "Q", "to": "uppercase" },
    { "from": "uppercase", "consume": "R", "to": "uppercase" },
    { "from": "uppercase", "consume": "S", "to": "uppercase" },
    { "from": "uppercase", "consume": "T", "to": "uppercase" },
    { "from": "uppercase", "consume": "U", "to": "uppercase" },
    { "from": "uppercase", "consume": "V", "to": "uppercase" },
    { "from": "uppercase", "consume": "W", "to": "uppercase" },
    { "from": "uppercase", "consume": "X", "to": "uppercase" },
    { "from": "uppercase", "consume": "Y", "to": "uppercase" },
    { "from": "uppercase", "consume": "Z", "to": "uppercase" }
  ]
};

verifyRecognizer(uppercase, {
  '': true,
  'r': false,
  'R': true,
  'Reg': false,
  'REG': true,
  'Reginald': false,
  'REGINALD': true
});

console.log('03-compiled-building-blocks.js');

const names = (() => {
  let i = 0;

  return function * names () {
    while (true) yield `G${++i}`;
  };
})();

function emptySet () {
  const [start] = names();

  return {
    start,
    "transitions": [],
    "accepting": []
  };
}

function emptyString () {
  const [start] = names();

  return {
    start,
    "transitions": [],
    "accepting": [start]
  };
}

function literal (symbol) {
  const [start, recognized] = names();

  return {
    start,
    "transitions": [
      { "from": start, "consume": symbol, "to": recognized }
    ],
    "accepting": [recognized]
  };
}

function shuntingYard (
  infixExpression,
  {
    operators,
    defaultOperator,
    escapeSymbol = '`',
    escapedValue = string => string
  }
) {
  const operatorsMap = new Map(
    Object.entries(operators)
  );

  const representationOf =
    something => {
      if (operatorsMap.has(something)) {
        const { symbol } = operatorsMap.get(something);

        return symbol;
      } else if (typeof something === 'string') {
        return something;
      } else {
        error(`${something} is not a value`);
      }
    };
  const typeOf =
    symbol => operatorsMap.has(symbol) ? operatorsMap.get(symbol).type : 'value';
  const isInfix =
    symbol => typeOf(symbol) === 'infix';
  const isPrefix =
    symbol => typeOf(symbol) === 'prefix';
  const isPostfix =
    symbol => typeOf(symbol) === 'postfix';
  const isCombinator =
    symbol => isInfix(symbol) || isPrefix(symbol) || isPostfix(symbol);
  const awaitsValue =
    symbol => isInfix(symbol) || isPrefix(symbol);

  const input = infixExpression.split('');
  const operatorStack = [];
  const reversePolishRepresentation = [];
  let awaitingValue = true;

  while (input.length > 0) {
    const symbol = input.shift();

    if (symbol === escapeSymbol) {
      if (input.length === 0) {
        error('Escape symbol ${escapeSymbol} has no following symbol');
      } else {
        const valueSymbol = input.shift();

        if (awaitingValue) {
          // push the escaped value of the symbol

          reversePolishRepresentation.push(escapedValue(valueSymbol));
        } else {
          // value catenation

          input.unshift(valueSymbol);
          input.unshift(escapeSymbol);
          input.unshift(defaultOperator);
        }
        awaitingValue = false;
      }
    } else if (symbol === '(' && awaitingValue) {
      // opening parenthesis case, going to build
      // a value
      operatorStack.push(symbol);
      awaitingValue = true;
    } else if (symbol === '(') {
      // value catenation

      input.unshift(symbol);
      input.unshift(defaultOperator);
      awaitingValue = false;
    } else if (symbol === ')') {
      // closing parenthesis case, clear the
      // operator stack

      while (operatorStack.length > 0 && peek(operatorStack) !== '(') {
        const op = operatorStack.pop();

        reversePolishRepresentation.push(representationOf(op));
      }

      if (peek(operatorStack) === '(') {
        operatorStack.pop();
        awaitingValue = false;
      } else {
        error('Unbalanced parentheses');
      }
    } else if (isPrefix(symbol)) {
      if (awaitingValue) {
        const { precedence } = operatorsMap.get(symbol);

        // pop higher-precedence operators off the operator stack
        while (isCombinator(symbol) && operatorStack.length > 0 && peek(operatorStack) !== '(') {
          const opPrecedence = operatorsMap.get(peek(operatorStack)).precedence;

          if (precedence < opPrecedence) {
            const op = operatorStack.pop();

            reversePolishRepresentation.push(representationOf(op));
          } else {
            break;
          }
        }

        operatorStack.push(symbol);
        awaitingValue = awaitsValue(symbol);
      } else {
        // value catenation

        input.unshift(symbol);
        input.unshift(defaultOperator);
        awaitingValue = false;
      }
    } else if (isCombinator(symbol)) {
      const { precedence } = operatorsMap.get(symbol);

      // pop higher-precedence operators off the operator stack
      while (isCombinator(symbol) && operatorStack.length > 0 && peek(operatorStack) !== '(') {
        const opPrecedence = operatorsMap.get(peek(operatorStack)).precedence;

        if (precedence < opPrecedence) {
          const op = operatorStack.pop();

          reversePolishRepresentation.push(representationOf(op));
        } else {
          break;
        }
      }

      operatorStack.push(symbol);
      awaitingValue = awaitsValue(symbol);
    } else if (awaitingValue) {
      // as expected, go straight to the output

      reversePolishRepresentation.push(representationOf(symbol));
      awaitingValue = false;
    } else {
      // value catenation

      input.unshift(symbol);
      input.unshift(defaultOperator);
      awaitingValue = false;
    }
  }

  // pop remaining symbols off the stack and push them
  while (operatorStack.length > 0) {
    const op = operatorStack.pop();

    if (operatorsMap.has(op)) {
      const { symbol: opSymbol } = operatorsMap.get(op);
      reversePolishRepresentation.push(opSymbol);
    } else {
      error(`Don't know how to push operator ${op}`);
    }
  }

  return reversePolishRepresentation;
}

function evaluate (expression, definition) {
  return stateMachine(
    shuntingYard(
      expression, definition
    ),
    definition
  );
}

function verifyEvaluateFirstCut (expression, definition, examples) {
  return verify(
    automate(evaluateFirstCut(expression, definition)),
    examples
  );
}

function verifyEvaluate (expression, definition, examples) {
  return verify(
    automate(evaluate(expression, definition)),
    examples
  );
}

const regexA = {
  operators: {
    '∅': {
      symbol: Symbol('∅'),
      type: 'atomic',
      fn: emptySet
    },
    'ε': {
      symbol: Symbol('ε'),
      type: 'atomic',
      fn: emptyString
    }
  },
  defaultOperator: undefined,
  toValue (string) {
    return literal(string);
  }
};

// ----------

verifyRecognizer(emptySet(), {
  '': false,
  '0': false,
  '1': false
});

verifyRecognizer(emptyString(), {
  '': true,
  '0': false,
  '1': false
});

verifyRecognizer(literal('0'), {
  '': false,
  '0': true,
  '1': false,
  '01': false,
  '10': false,
  '11': false
});

const emptySetRecognizer = evaluateFirstCut('∅', regexA);
const emptyStringRecognizer = evaluateFirstCut('ε', regexA);
const rRecognizer = evaluateFirstCut('r', regexA);

verifyRecognizer(emptySetRecognizer, {
  '': false,
  '0': false,
  '1': false
});

verifyRecognizer(emptyStringRecognizer, {
  '': true,
  '0': false,
  '1': false
});

verifyRecognizer(rRecognizer, {
  '': false,
  'r': true,
  'R': false,
  'reg': false,
  'Reg': false
});

verifyEvaluateFirstCut('∅', regexA, {
  '': false,
  '0': false,
  '1': false
});

verifyEvaluateFirstCut('ε', regexA, {
  '': true,
  '0': false,
  '1': false
});

verifyEvaluateFirstCut('r', regexA, {
  '': false,
  'r': true,
  'R': false,
  'reg': false,
  'Reg': false
});

verifyEvaluate('∅', regexA, {
  '': false,
  '∅': false,
  'ε': false
});

verifyEvaluate('`∅', regexA, {
  '': false,
  '∅': true,
  'ε': false
});

verifyEvaluate('ε', regexA, {
  '': true,
  '∅': false,
  'ε': false
});

verifyEvaluate('`ε', regexA, {
  '': false,
  '∅': false,
  'ε': true
});

console.log('04-product-and-union.js')

// A state aggregator maps a set of states
// (such as the two states forming part of the product
// of two finite-state recognizers) to a new state.
class StateAggregator {
  constructor () {
    this.map = new Map();
    this.inverseMap = new Map();
  }

  stateFromSet (...states) {
    const materialStates = states.filter(s => s != null);

    if (materialStates.some(ms => this.inverseMap.has(ms))) {
      error(`Surprise! Aggregating an aggregate!!`);
    }

    if (materialStates.length === 0) {
      error('tried to get an aggregate state name for no states');
    } else if (materialStates.length === 1) {
      // do not need a new state name
      return materialStates[0];
    } else {
      const key = materialStates.sort().map(s=>`(${s})`).join('');

      if (this.map.has(key)) {
        return this.map.get(key);
      } else {
        const [newState] = names();

        this.map.set(key, newState);
        this.inverseMap.set(newState, new Set(materialStates));

        return newState;
      }
    }
  }

  setFromState (state) {
    if (this.inverseMap.has(state)) {
      return this.inverseMap.get(state);
    } else {
      return new Set([state]);
    }
  }
}

// NOTA BENE: `product` is "unsafe" in that it
// recycles some of the states from its input
// descriptions
function product (a, b, P = new StateAggregator()) {
  const {
    stateMap: aStateMap,
    start: aStart
  } = validatedAndProcessed(a);
  const {
    stateMap: bStateMap,
    start: bStart
  } = validatedAndProcessed(b);

  // R is a collection of states "remaining" to be analyzed
  // it is a map from the product's state name to the individual states
  // for a and b
  const R = new Map();

  // T is a collection of states already analyzed
  // it is a map from a product's state name to the transitions
  // for that state
  const T = new Map();

  // seed R
  const start = P.stateFromSet(aStart, bStart);
  R.set(start, [aStart, bStart]);

  while (R.size > 0) {
    const [[abState, [aState, bState]]] = R.entries();
    const aTransitions = aState != null ? (aStateMap.get(aState) || []) : [];
    const bTransitions = bState != null ? (bStateMap.get(bState) || []) : [];

    let abTransitions = [];

    if (T.has(abState)) {
      error(`Error taking product: T and R both have ${abState} at the same time.`);
    }

    if (aTransitions.length === 0 && bTransitions.length == 0) {
      // dead end for both
      // will add no transitions
      // we put it in T just to avoid recomputing this if it's referenced again
      T.set(abState, []);
    } else if (aTransitions.length === 0) {
      const aTo = null;
      abTransitions = bTransitions.map(
        ({ consume, to: bTo }) => ({ from: abState, consume, to: P.stateFromSet(aTo, bTo), aTo, bTo })
      );
    } else if (bTransitions.length === 0) {
      const bTo = null;
      abTransitions = aTransitions.map(
        ({ consume, to: aTo }) => ({ from: abState, consume, to: P.stateFromSet(aTo, bTo), aTo, bTo })
      );
    } else {
      // both a and b have transitions
      const aConsumeToMap =
        aTransitions.reduce(
          (acc, { consume, to }) => (acc.set(consume, to), acc),
          new Map()
        );
      const bConsumeToMap =
        bTransitions.reduce(
          (acc, { consume, to }) => (acc.set(consume, to), acc),
          new Map()
        );

      for (const { from, consume, to: aTo } of aTransitions) {
        const bTo = bConsumeToMap.has(consume) ? bConsumeToMap.get(consume) : null;

        if (bTo != null) {
          bConsumeToMap.delete(consume);
        }

        abTransitions.push({ from: abState, consume, to: P.stateFromSet(aTo, bTo), aTo, bTo });
      }

      for (const [consume, bTo] of bConsumeToMap.entries()) {
        const aTo = null;

        abTransitions.push({ from: abState, consume, to: P.stateFromSet(aTo, bTo), aTo, bTo });
      }
    }

    T.set(abState, abTransitions);

    for (const { to, aTo, bTo } of abTransitions) {
      // more work remaining?
      if (!T.has(to) && !R.has(to)) {
        R.set(to, [aTo, bTo]);
      }
    }

    R.delete(abState);
  }

  const accepting = [];

  const transitions =
    [...T.values()].flatMap(
      tt => tt.map(
        ({ from, consume, to }) => ({ from, consume, to })
      )
    );

  return { start, accepting, transitions };

}

function union2 (a, b) {
  const {
    states: aDeclaredStates,
    accepting: aAccepting
  } = validatedAndProcessed(a);
  const aStates = [null].concat(aDeclaredStates);

  const {
    states: bDeclaredStates,
    accepting: bAccepting
  } = validatedAndProcessed(b);
  const bStates = [null].concat(bDeclaredStates);

  // P is a mapping from a pair of states (or any set, but in union2 it's always a pair)
  // to a new state representing the tuple of those states
  const P = new StateAggregator();

  const productAB = product(a, b, P);
  const { start, transitions } = productAB;

  const statesAAccepts =
    aAccepting.flatMap(
      aAcceptingState => bStates.map(bState => P.stateFromSet(aAcceptingState, bState))
    );
  const statesBAccepts =
    bAccepting.flatMap(
      bAcceptingState => aStates.map(aState => P.stateFromSet(aState, bAcceptingState))
    );

  const allAcceptingStates =
    [...new Set([...statesAAccepts, ...statesBAccepts])];

  const { stateSet: reachableStates } = validatedAndProcessed(productAB);
  const accepting = allAcceptingStates.filter(state => reachableStates.has(state));

  return { start, accepting, transitions };
}

const regexB = {
  operators: {
    '∅': {
      symbol: Symbol('∅'),
      type: 'atomic',
      fn: emptySet
    },
    'ε': {
      symbol: Symbol('ε'),
      type: 'atomic',
      fn: emptyString
    },
    '|': {
      symbol: Symbol('|'),
      type: 'infix',
      precedence: 10,
      fn: union2
    }
  },
  defaultOperator: undefined,
  toValue (string) {
    return literal(string);
  }
};

// ----------

verifyRecognizer(union2(reg, uppercase), {
  '': true,
  'r': false,
  'R': true,
  'Reg': true,
  'REG': true,
  'Reginald': false,
  'REGINALD': true
});

verifyEvaluate('a', regexB, {
  '': false,
  'a': true,
  'A': false,
  'aa': false,
  'AA': false
});

verifyEvaluate('A', regexB, {
  '': false,
  'a': false,
  'A': true,
  'aa': false,
  'AA': false
});

verifyEvaluate('a|A', regexB, {
  '': false,
  'a': true,
  'A': true,
  'aa': false,
  'AA': false
});

console.log('05-epsilon-transitions-powerset-and-catenation.js');

function epsilonCatenate (a, b) {
  const joinTransitions =
    a.accepting.map(
      from => ({ from, to: b.start })
    );

  return {
    start: a.start,
    accepting: b.accepting,
    transitions:
      a.transitions
        .concat(joinTransitions)
        .concat(b.transitions)
  };
}

function removeEpsilonTransitions ({ start, accepting, transitions }) {
  const acceptingSet = new Set(accepting);
  const transitionsWithoutEpsilon =
    transitions
      .filter(({ consume }) => consume != null);
  const stateMapWithoutEpsilon = toStateMap(transitionsWithoutEpsilon);
  const epsilonMap =
    transitions
      .filter(({ consume }) => consume == null)
      .reduce(
          (acc, { from, to }) => {
            const toStates = acc.has(from) ? acc.get(from) : new Set();

            toStates.add(to);
            acc.set(from, toStates);
            return acc;
          },
          new Map()
        );

  const epsilonQueue = [...epsilonMap.entries()];
  const epsilonFromStatesSet = new Set(epsilonMap.keys());

  const outerBoundsOnNumberOfRemovals = transitions.length;
  let loops = 0;

  while (epsilonQueue.length > 0 && loops++ <= outerBoundsOnNumberOfRemovals) {
    let [epsilonFrom, epsilonToSet] = epsilonQueue.shift();
    const allEpsilonToStates = [...epsilonToSet];

    // special case: We can ignore self-epsilon transitions (e.g. a-->a)
    const epsilonToStates = allEpsilonToStates.filter(
      toState => toState !== epsilonFrom
    );

    // we defer resolving destinations that have epsilon transitions
    const deferredEpsilonToStates = epsilonToStates.filter(s => epsilonFromStatesSet.has(s));
    if (deferredEpsilonToStates.length > 0) {
      // defer them
      epsilonQueue.push([epsilonFrom, deferredEpsilonToStates]);
    } else {
      // if nothing to defer, remove this from the set
      epsilonFromStatesSet.delete(epsilonFrom);
    }

    // we can immediately resolve destinations that themselves don't have epsilon transitions
    const immediateEpsilonToStates = epsilonToStates.filter(s => !epsilonFromStatesSet.has(s));
    for (const epsilonTo of immediateEpsilonToStates) {
      const source =
        stateMapWithoutEpsilon.get(epsilonTo) || [];
      const potentialToMove =
        source.map(
          ({ consume, to }) => ({ from: epsilonFrom, consume, to })
        );
      const existingTransitions = stateMapWithoutEpsilon.get(epsilonFrom) || [];

      // filter out duplicates
      const needToMove = potentialToMove.filter(
        ({ consume: pConsume, to: pTo }) =>
          !existingTransitions.some(
            ({ consume: eConsume, to: eTo }) => pConsume === eConsume && pTo === eTo
          )
      );
      // now add the moved transitions
      stateMapWithoutEpsilon.set(epsilonFrom, existingTransitions.concat(needToMove));

      // special case!
      if (acceptingSet.has(epsilonTo)) {
        acceptingSet.add(epsilonFrom);
      }
    }
  }

  if (loops > outerBoundsOnNumberOfRemovals) {
    error("Attempted to remove too many epsilon transitions. Investigate possible loop.");
  } else {
    return {
      start,
      accepting: [...acceptingSet],
      transitions: [
        ...stateMapWithoutEpsilon.values()
      ].flatMap( tt => tt )
    };
  }
}

function reachableFromStart ({ start, accepting: allAccepting, transitions: allTransitions }) {
  const stateMap = toStateMap(allTransitions, true);
  const reachableMap = new Map();
  const R = new Set([start]);

  while (R.size > 0) {
    const [state] = [...R];
    R.delete(state);
    const transitions = stateMap.get(state) || [];

    // this state is reachable
    reachableMap.set(state, transitions);

    const reachableFromThisState =
      transitions.map(({ to }) => to);

    const unprocessedReachableFromThisState =
      reachableFromThisState
        .filter(to => !reachableMap.has(to) && !R.has(to));

    for (const reachableState of unprocessedReachableFromThisState) {
      R.add(reachableState);
    }
  }

  const transitions = [...reachableMap.values()].flatMap(tt => tt);

  // prune unreachable states from the accepting set
  const reachableStates = new Set(
    [start].concat(
      transitions.map(({ to }) => to)
    )
  );

  const accepting = allAccepting.filter( state => reachableStates.has(state) );

  return {
    start,
    transitions,
    accepting
  };
}

// NOTA BENE: `powerset` is unsafe:
// it recycle some of its input states
function powerset (description, P = new StateAggregator()) {
  const {
    start: nfaStart,
    acceptingSet: nfaAcceptingSet,
    stateMap: nfaStateMap
  } = validatedAndProcessed(description, true);

  // the final set of accepting states
  const dfaAcceptingSet = new Set();

  // R is the work "remaining" to be analyzed
  // organized as a set of states to process
  const R = new Set([ nfaStart ]);

  // T is a collection of states already analyzed
  // it is a map from the state name to the transitions
  // from that state
  const T = new Map();

  while (R.size > 0) {
    const [stateName] = [...R];
    R.delete(stateName);

    // all powerset states represent sets of state,
    // with the degenerate case being a state that only represents
    // itself. stateSet is the full set represented
    // by stateName
    const stateSet = P.setFromState(stateName);

    // get the aggregate transitions across all states
    // in the set
    const aggregateTransitions =
      [...stateSet].flatMap(s => nfaStateMap.get(s) || []);

    // a map from a symbol consumed to the set of
    // destination states
    const symbolToStates =
      aggregateTransitions
        .reduce(
          (acc, { consume, to }) => {
            const toStates = acc.has(consume) ? acc.get(consume) : new Set();

            toStates.add(to);
            acc.set(consume, toStates);
            return acc;
          },
          new Map()
        );

    const dfaTransitions = [];

  	for (const [consume, toStates] of symbolToStates.entries()) {
      const toStatesName = P.stateFromSet(...toStates);

      dfaTransitions.push({ from: stateName, consume, to: toStatesName });

      const hasBeenDone = T.has(toStatesName);
      const isInRemainingQueue = R.has(toStatesName)

      if (!hasBeenDone && !isInRemainingQueue) {
        R.add(toStatesName);
      }
    }

    T.set(stateName, dfaTransitions);

    const anyStateIsAccepting =
      [...stateSet].some(s => nfaAcceptingSet.has(s));

    if (anyStateIsAccepting) {
      dfaAcceptingSet.add(stateName);
    }

  }

  return {
    start: nfaStart,
    accepting: [...dfaAcceptingSet],
    transitions:
      [...T.values()]
        .flatMap(tt => tt)
  };
}

function catenation2 (a, b) {
  return powerset(
    reachableFromStart(
      removeEpsilonTransitions(
        epsilonCatenate(a, b)
      )
    )
  );
}

const regexC = {
  operators: {
    '∅': {
      symbol: Symbol('∅'),
      type: 'atomic',
      fn: emptySet
    },
    'ε': {
      symbol: Symbol('ε'),
      type: 'atomic',
      fn: emptyString
    },
    '|': {
      symbol: Symbol('|'),
      type: 'infix',
      precedence: 10,
      fn: union2
    },
    '→': {
      symbol: Symbol('→'),
      type: 'infix',
      precedence: 20,
      fn: catenation2
    }
  },
  defaultOperator: '→',
  toValue (string) {
    return literal(string);
  }
};

// ----------

const zeroes = {
  "start": 'empty',
  "accepting": ['zeroes'],
  "transitions": [
    { "from": 'empty', "consume": '0', "to": 'zeroes' },
    { "from": 'zeroes', "consume": '0', "to": 'zeroes' }
  ]
};

verifyRecognizer(catenation2(zeroes, binary), {
  '': false,
  '0': false,
  '1': false,
  '00': true,
  '01': true,
  '10': false,
  '11': false,
  '000': true,
  '001': true,
  '010': true,
  '011': true,
  '100': false,
  '101': false,
  '110': false,
  '111': false
});

verifyEvaluate('r→e→g', regexC, {
  '': false,
  'r': false,
  're': false,
  'reg': true,
  'reggie': false
});

verifyEvaluate('reg', regexC, {
  '': false,
  'r': false,
  're': false,
  'reg': true,
  'reggie': false
});

verifyEvaluate('reg|reggie', regexC, {
  '': false,
  'r': false,
  're': false,
  'reg': true,
  'reggie': true
});

console.log('06-merge-equivalent-states.js');

const keyS =
  (transitions, accepting) => {
    const stringifiedTransitions =
      transitions
        .map(({ consume, to }) => `${consume}-->${to}`)
        .sort()
        .join(', ');
    const acceptingSuffix = accepting ? '-->*' : '';

    return `[${stringifiedTransitions}]${acceptingSuffix}`;
  };

function mergeEquivalentStates (description) {
  searchForDuplicate: while (true) {
    let {
      start,
      transitions: allTransitions,
      accepting,
      states,
      stateMap,
      acceptingSet
    } = validatedAndProcessed(description);

    const statesByKey = new Map();

    for (const state of states) {
      const stateTransitions = stateMap.get(state) || [];
      const isAccepting = acceptingSet.has(state);
      const key = keyS(stateTransitions, isAccepting);

      if (statesByKey.has(key)) {
        // found a dup!
        const originalState = statesByKey.get(key);

        if (start === state) {
          // point start to original
          start = originalState;
        }

        // remove duplicate's transitions
        allTransitions = allTransitions.filter(
          ({ from }) => from !== state
        );

        // rewire all former incoming transitions
        allTransitions = allTransitions.map(
          ({ from, consume, to }) => ({
            from, consume, to: (to === state ? originalState : to)
          })
        );

        if (isAccepting) {
          // remove state from accepting
          accepting = accepting.filter(s => s !== state)
        }

        // reset description
        description = { start, transitions: allTransitions, accepting };

        // and then start all over again
        continue searchForDuplicate;
      } else {
        statesByKey.set(key, state);
      }
    }
    // no duplicates found
    break;
  }

  return description;
}

function union2merged (a, b) {
  return mergeEquivalentStates(
    union2(a, b)
  );
}

const regexD = {
  operators: {
    '∅': {
      symbol: Symbol('∅'),
      type: 'atomic',
      fn: emptySet
    },
    'ε': {
      symbol: Symbol('ε'),
      type: 'atomic',
      fn: emptyString
    },
    '|': {
      symbol: Symbol('|'),
      type: 'infix',
      precedence: 10,
      fn: union2merged
    },
    '→': {
      symbol: Symbol('→'),
      type: 'infix',
      precedence: 20,
      fn: catenation2
    }
  },
  defaultOperator: '→',
  toValue (string) {
    return literal(string);
  }
};

function verifyStateCount (definition, examples) {
  function countStates (regex) {
    const fsr = evaluate(regex, definition);

    const states = toStateSet(fsr.transitions);
    states.add(fsr.start);

    return states.size;
  }

  return verify(countStates, examples);
}

// ----------

const caseInsensitiveABC = "(a|A)(b|B)(c|C)"
const abcde = "(a|b|c|d|e)";
const lowercase =
  "(a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z)";

const fiveABCDEs =
  `${abcde}${abcde}${abcde}${abcde}${abcde}`;
const twoLowercaseLetters =
  `${lowercase}${lowercase}`;

verifyEvaluate(caseInsensitiveABC, regexC, {
  '': false,
  'a': false,
  'z': false,
  'ab': false,
  'kl': false,
  'abc': true,
  'AbC': true,
  'edc': false,
  'abcde': false,
  'abCde': false,
  'dcabe': false,
  'abcdef': false
});

verifyEvaluate(fiveABCDEs, regexC, {
  '': false,
  'a': false,
  'z': false,
  'ab': false,
  'kl': false,
  'abc': false,
  'AbC': false,
  'edc': false,
  'abcde': true,
  'dcabe': true,
  'abcdef': false,
  'abCde': false
});

verifyEvaluate(twoLowercaseLetters, regexC, {
  '': false,
  'a': false,
  'z': false,
  'ab': true,
  'kl': true,
  'abc': false,
  'AbC': false,
  'edc': false,
  'abcde': false,
  'dcabe': false,
  'abcdef': false,
  'abCde': false
});

verifyStateCount(regexC, {
  [caseInsensitiveABC]: 7,
  [fiveABCDEs]: 26,
  [twoLowercaseLetters]: 53
});

verifyEvaluate(caseInsensitiveABC, regexD, {
  '': false,
  'a': false,
  'z': false,
  'ab': false,
  'kl': false,
  'abc': true,
  'AbC': true,
  'edc': false,
  'abcde': false,
  'abCde': false,
  'dcabe': false,
  'abcdef': false
});

verifyEvaluate(fiveABCDEs, regexD, {
  '': false,
  'a': false,
  'z': false,
  'ab': false,
  'kl': false,
  'abc': false,
  'AbC': false,
  'edc': false,
  'abcde': true,
  'dcabe': true,
  'abcdef': false,
  'abCde': false
});

verifyEvaluate(twoLowercaseLetters, regexD, {
  '': false,
  'a': false,
  'z': false,
  'ab': true,
  'kl': true,
  'abc': false,
  'AbC': false,
  'edc': false,
  'abcde': false,
  'dcabe': false,
  'abcdef': false,
  'abCde': false
});

verifyStateCount(regexD, {
  [caseInsensitiveABC]: 4,
  [fiveABCDEs]: 6,
  [twoLowercaseLetters]: 3
});

console.log('07-kleene-star.js');

function oneOrMore (description) {
  const {
    start,
    transitions,
    accepting
  } = description;

  const withEpsilonTransitions = {
    start,
    transitions:
      transitions.concat(
        accepting.map(
          acceptingState => ({ from: acceptingState, to: start })
        )
      ),
      accepting
  };

  const oneOrMore = reachableFromStart(
    mergeEquivalentStates(
      powerset(
        removeEpsilonTransitions(
          withEpsilonTransitions
        )
      )
    )
  );

  return oneOrMore;
}

function zeroOrOne (description) {
  return union2merged(description, emptyString());
}

function zeroOrMore (description) {
  return zeroOrOne(oneOrMore(description));
}

const formalRegularExpressions = {
  operators: {
    '∅': {
      symbol: Symbol('∅'),
      type: 'atomic',
      fn: emptySet
    },
    'ε': {
      symbol: Symbol('ε'),
      type: 'atomic',
      fn: emptyString
    },
    '|': {
      symbol: Symbol('|'),
      type: 'infix',
      precedence: 10,
      fn: union2merged
    },
    '→': {
      symbol: Symbol('→'),
      type: 'infix',
      precedence: 20,
      fn: catenation2
    },
    '*': {
      symbol: Symbol('*'),
      type: 'postfix',
      precedence: 30,
      fn: zeroOrMore
    }
  },
  defaultOperator: '→',
  toValue (string) {
    return literal(string);
  }
};

// ----------

const Aa = {
  "start": "empty",
  "transitions": [
    { "from": "empty", "consume": "A", "to": "Aa" },
    { "from": "empty", "consume": "a", "to": "Aa" }
  ],
  "accepting": ["Aa"]
};

verifyRecognizer(Aa, {
  '': false,
  'a': true,
  'A': true,
  'aa': false,
  'Aa': false,
  'AA': false,
  'aaaAaAaAaaaAaa': false,
  ' a': false,
  'a ': false,
  'eh?': false
});

verifyEvaluate('((a|A)|ε)', formalRegularExpressions, {
  '': true,
  'a': true,
  'A': true,
  'aa': false,
  'Aa': false,
  'AA': false,
  'aaaAaAaAaaaAaa': false,
  ' a': false,
  'a ': false,
  'eh?': false
});

verifyRecognizer(zeroOrOne(Aa), {
  '': true,
  'a': true,
  'A': true,
  'aa': false,
  'Aa': false,
  'AA': false,
  'aaaAaAaAaaaAaa': false,
  ' a': false,
  'a ': false,
  'eh?': false
});

verifyRecognizer(oneOrMore(Aa), {
  '': false,
  'a': true,
  'A': true,
  'aa': true,
  'Aa': true,
  'AA': true,
  'aaaAaAaAaaaAaa': true,
  ' a': false,
  'a ': false,
  'eh?': false
});

verifyRecognizer(zeroOrMore(Aa), {
  '': true,
  'a': true,
  'A': true,
  'aa': true,
  'Aa': true,
  'AA': true,
  'aaaAaAaAaaaAaa': true,
  ' a': false,
  'a ': false,
  'eh?': false
});

verifyEvaluate('(a|A)*', formalRegularExpressions, {
  '': true,
  'a': true,
  'A': true,
  'aa': true,
  'Aa': true,
  'AA': true,
  'aaaAaAaAaaaAaa': true,
  ' a': false,
  'a ': false,
  'eh?': false
});

verifyEvaluate('ab*c', formalRegularExpressions, {
  '': false,
  'a': false,
  'ac': true,
  'abc': true,
  'abbbc': true,
  'abbbbb': false
});

console.log('08-transpiler.js');

function dup (a) {
  const {
    start: oldStart,
    transitions: oldTransitions,
    accepting: oldAccepting,
    allStates
  } = validatedAndProcessed(a);

  const map = new Map(
    [...allStates].map(
      old => [old, names().next().value]
    )
  );

  const start = map.get(oldStart);
  const transitions =
    oldTransitions.map(
      ({ from, consume,  to }) => ({ from: map.get(from), consume, to: map.get(to) })
    );
  const accepting =
    oldAccepting.map(
      state => map.get(state)
    )

  return { start, transitions, accepting };
}

const extended = {
  operators: {
    // formal regular expressions

    '∅': {
      symbol: Symbol('∅'),
      type: 'atomic',
      fn: emptySet
    },
    'ε': {
      symbol: Symbol('ε'),
      type: 'atomic',
      fn: emptyString
    },
    '|': {
      symbol: Symbol('|'),
      type: 'infix',
      precedence: 10,
      fn: union2merged
    },
    '→': {
      symbol: Symbol('→'),
      type: 'infix',
      precedence: 20,
      fn: catenation2
    },
    '*': {
      symbol: Symbol('*'),
      type: 'postfix',
      precedence: 30,
      fn: zeroOrMore
    },

    // extended operators

    '?': {
      symbol: Symbol('?'),
      type: 'postfix',
      precedence: 30,
      fn: a => union2merged(emptyString(), a)
    },
    '+': {
      symbol: Symbol('+'),
      type: 'postfix',
      precedence: 30,
      fn: a => catenation2(a, zeroOrMore(dup(a)))
    }
  },
  defaultOperator: '→',
  toValue (string) {
    return literal(string);
  }
};

function p (expr) {
  if (expr.length === 1) {
    return expr;
  } else if (expr[0] === '`') {
    return expr;
  } else if (expr[0] === '(' && expr[expr.length - 1] === ')') {
    return expr;
  } else {
    return `(${expr})`;
  }
};

const toValueExpr = string => {
  if ('∅ε|→*()'.indexOf(string) >= 0) {
    return '`' + string;
  } else {
    return string;
  }
};

const transpile0to0 = {
  operators: {
    '∅': {
      symbol: Symbol('∅'),
      type: 'atomic',
      fn: () => '∅'
    },
    'ε': {
      symbol: Symbol('ε'),
      type: 'atomic',
      fn: () => 'ε'
    },
    '|': {
      symbol: Symbol('|'),
      type: 'infix',
      precedence: 10,
      fn: (a, b) => `${p(a)}|${p(b)}`
    },
    '→': {
      symbol: Symbol('→'),
      type: 'infix',
      precedence: 20,
      fn: (a, b) => `${p(a)}→${p(b)}`
    },
    '*': {
      symbol: Symbol('*'),
      type: 'postfix',
      precedence: 30,
      fn: a => `${p(a)}*`
    }
  },
  defaultOperator: '→',
  escapeSymbol: '`',
  toValue: toValueExpr
};

const transpile1to0q = {
  operators: {
    '∅': {
      symbol: Symbol('∅'),
      type: 'atomic',
      fn: () => '∅'
    },
    'ε': {
      symbol: Symbol('ε'),
      type: 'atomic',
      fn: () => 'ε'
    },
    '|': {
      symbol: Symbol('|'),
      type: 'infix',
      precedence: 10,
      fn: (a, b) => `${p(a)}|${p(b)}`
    },
    '→': {
      symbol: Symbol('→'),
      type: 'infix',
      precedence: 20,
      fn: (a, b) => `${p(a)}→${p(b)}`
    },
    '*': {
      symbol: Symbol('*'),
      type: 'postfix',
      precedence: 30,
      fn: a => `${p(a)}*`
    },
    '?': {
      symbol: Symbol('?'),
      type: 'postfix',
      precedence: 30,
      fn: a => `ε|${p(a)}`
    },
    '+': {
      symbol: Symbol('+'),
      type: 'postfix',
      precedence: 30,
      fn: a => `${p(a)}${p(a)}*`
    }
  },
  defaultOperator: '→',
  escapeSymbol: '`',
  toValue: toValueExpr
};

const ALPHA = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const UNDERSCORE ='_';
const PUNCTUATION = `~!@#$%^&*()_+=-\`-={}|[]\\:";'<>?,./`;
const WHITESPACE = ' \t\r\n';

const TOTAL_ALPHABET = ALPHA + DIGITS + PUNCTUATION + WHITESPACE;

const dotExpr =
  TOTAL_ALPHABET
    .split('')
    .map(toValueExpr)
    .join('|');

const transpile1to0qd = {
  operators: {
    '∅': {
      symbol: Symbol('∅'),
      type: 'atomic',
      fn: () => '∅'
    },
    'ε': {
      symbol: Symbol('ε'),
      type: 'atomic',
      fn: () => 'ε'
    },
    '|': {
      symbol: Symbol('|'),
      type: 'infix',
      precedence: 10,
      fn: (a, b) => `${p(a)}|${p(b)}`
    },
    '→': {
      symbol: Symbol('→'),
      type: 'infix',
      precedence: 20,
      fn: (a, b) => `${p(a)}→${p(b)}`
    },
    '*': {
      symbol: Symbol('*'),
      type: 'postfix',
      precedence: 30,
      fn: a => `${p(a)}*`
    },
    '?': {
      symbol: Symbol('?'),
      type: 'postfix',
      precedence: 30,
      fn: a => `ε|${p(a)}`
    },
    '+': {
      symbol: Symbol('+'),
      type: 'postfix',
      precedence: 30,
      fn: a => `${p(a)}${p(a)}*`
    },
    '.': {
      symbol: Symbol('.'),
      type: 'atomic',
      fn: () => dotExpr
    }
  },
  defaultOperator: '→',
  escapeSymbol: '`',
  toValue: toValueExpr
};

const digitsExpression = DIGITS.split('').join('|');
const wordExpression = (ALPHA + DIGITS + UNDERSCORE).split('').join('|');
const whitespaceExpression = WHITESPACE.split('').join('|');

const digitsSymbol = Symbol('`d');
const wordSymbol = Symbol('`w');
const whitespaceSymbol = Symbol('`s');

const transpile1to0qs = {
  operators: {
    '∅': {
      symbol: Symbol('∅'),
      type: 'atomic',
      fn: () => '∅'
    },
    'ε': {
      symbol: Symbol('ε'),
      type: 'atomic',
      fn: () => 'ε'
    },
    '|': {
      symbol: Symbol('|'),
      type: 'infix',
      precedence: 10,
      fn: (a, b) => `${p(a)}|${p(b)}`
    },
    '→': {
      symbol: Symbol('→'),
      type: 'infix',
      precedence: 20,
      fn: (a, b) => `${p(a)}→${p(b)}`
    },
    '*': {
      symbol: Symbol('*'),
      type: 'postfix',
      precedence: 30,
      fn: a => `${p(a)}*`
    },
    '?': {
      symbol: Symbol('?'),
      type: 'postfix',
      precedence: 30,
      fn: a => `ε|${p(a)}`
    },
    '+': {
      symbol: Symbol('+'),
      type: 'postfix',
      precedence: 30,
      fn: a => `${p(a)}${p(a)}*`
    },
    '.': {
      symbol: Symbol('.'),
      type: 'atomic',
      fn: () => dotExpr
    },
    '__DIGITS__': {
      symbol: digitsSymbol,
      type: 'atomic',
      fn: () => digitsExpression
    },
    '__WORD__': {
      symbol: wordSymbol,
      type: 'atomic',
      fn: () => wordExpression
    },
    '__WHITESPACE__': {
      symbol: whitespaceSymbol,
      type: 'atomic',
      fn: () => whitespaceExpression
    }
  },
  defaultOperator: '→',
  escapedValue (symbol) {
    if (symbol === 'd') {
      return digitsSymbol;
    } else if (symbol === 'w') {
      return wordSymbol;
    } else if (symbol === 's') {
      return whitespaceSymbol;
    } else {
      return symbol;
    }
  },
  toValue: toValueExpr
};

function timesExpr (a, b) {
  const n = Number.parseInt(b, 10);

  if (typeof n === "number") {
    return `(${new Array(n).fill(p(a)).join('')})`;
  } else {
    error(`Can't parse ${a}⊗${b}, because ${b} does not appear to be a number.`);
  }
}

const transpile1to0qsm = {
  operators: {
    '∅': {
      symbol: Symbol('∅'),
      type: 'atomic',
      fn: () => '∅'
    },
    'ε': {
      symbol: Symbol('ε'),
      type: 'atomic',
      fn: () => 'ε'
    },
    '|': {
      symbol: Symbol('|'),
      type: 'infix',
      precedence: 10,
      fn: (a, b) => `${p(a)}|${p(b)}`
    },
    '→': {
      symbol: Symbol('→'),
      type: 'infix',
      precedence: 20,
      fn: (a, b) => `${p(a)}→${p(b)}`
    },
    '*': {
      symbol: Symbol('*'),
      type: 'postfix',
      precedence: 30,
      fn: a => `${p(a)}*`
    },
    '?': {
      symbol: Symbol('?'),
      type: 'postfix',
      precedence: 30,
      fn: a => `ε|${p(a)}`
    },
    '+': {
      symbol: Symbol('+'),
      type: 'postfix',
      precedence: 30,
      fn: a => `${p(a)}${p(a)}*`
    },
    '.': {
      symbol: Symbol('.'),
      type: 'atomic',
      fn: () => dotExpr
    },
    '__DIGITS__': {
      symbol: digitsSymbol,
      type: 'atomic',
      fn: () => digitsExpression
    },
    '__WORD__': {
      symbol: wordSymbol,
      type: 'atomic',
      fn: () => wordExpression
    },
    '__WHITESPACE__': {
      symbol: whitespaceSymbol,
      type: 'atomic',
      fn: () => whitespaceExpression
    },
    '⊗': {
      symbol: Symbol('⊗'),
      type: 'infix',
      precedence: 25,
      fn: timesExpr
    }
  },
  defaultOperator: '→',
  escapedValue (symbol) {
    if (symbol === 'd') {
      return digitsSymbol;
    } else if (symbol === 'w') {
      return wordSymbol;
    } else if (symbol === 's') {
      return whitespaceSymbol;
    } else {
      return symbol;
    }
  },
  toValue: toValueExpr
};

const anySymbol =
  () => TOTAL_ALPHABET.split('').map(literal).reduce(union2merged);
const anyDigit =
  () => DIGITS.split('').map(literal).reduce(union2merged);
const anyWord =
  () => (ALPHA + DIGITS + UNDERSCORE).map(literal).reduce(union2merged);
const anyWhitespace =
  () => WHITESPACE.map(literal).reduce(union2merged);

const levelOneExpressions = {
  operators: {
    // formal regular expressions

    '∅': {
      symbol: Symbol('∅'),
      type: 'atomic',
      fn: emptySet
    },
    'ε': {
      symbol: Symbol('ε'),
      type: 'atomic',
      fn: emptyString
    },
    '|': {
      symbol: Symbol('|'),
      type: 'infix',
      precedence: 10,
      fn: union2merged
    },
    '→': {
      symbol: Symbol('→'),
      type: 'infix',
      precedence: 20,
      fn: catenation2
    },
    '*': {
      symbol: Symbol('*'),
      type: 'postfix',
      precedence: 30,
      fn: zeroOrMore
    },

    // extended operators

    '?': {
      symbol: Symbol('?'),
      type: 'postfix',
      precedence: 30,
      fn: zeroOrOne
    },
    '+': {
      symbol: Symbol('+'),
      type: 'postfix',
      precedence: 30,
      fn: oneOrMore
    },
    '.': {
      symbol: Symbol('.'),
      type: 'atomic',
      fn: anySymbol
    },
    '__DIGITS__': {
      symbol: digitsSymbol,
      type: 'atomic',
      fn: anyDigit
    },
    '__WORD__': {
      symbol: wordSymbol,
      type: 'atomic',
      fn: anyWord
    },
    '__WHITESPACE__': {
      symbol: whitespaceSymbol,
      type: 'atomic',
      fn: anyWhitespace
    }
  },
  defaultOperator: '→',
  escapedValue (symbol) {
    if (symbol === 'd') {
      return digitsSymbol;
    } else if (symbol === 'w') {
      return wordSymbol;
    } else if (symbol === 's') {
      return whitespaceSymbol;
    } else {
      return symbol;
    }
  },
  toValue (string) {
    return literal(string);
  }
};

// ----------

const reggieLevel0 = '(R|r)eg(ε|gie(ε|ee*!))';

verifyEvaluate(reggieLevel0, formalRegularExpressions, {
  '': false,
  'r': false,
  'reg': true,
  'Reg': true,
  'Regg': false,
  'Reggie': true,
  'Reggieeeeeee!': true
});

const reggieLevel1 = '(R|r)eg(gie(e+!)?)?';

verifyEvaluate(reggieLevel1, extended, {
  '': false,
  'r': false,
  'reg': true,
  'Reg': true,
  'Regg': false,
  'Reggie': true,
  'Reggieeeeeee!': true
});

const reggieCompiledToLevel0 = evaluate(reggieLevel0, transpile0to0);

verifyEvaluate(reggieCompiledToLevel0, formalRegularExpressions, {
  '': false,
  'r': false,
  'reg': true,
  'Reg': true,
  'Regg': false,
  'Reggie': true,
  'Reggieeeeeee!': true
});

const reggieCompiledToLevel0q = evaluate(reggieLevel1, transpile1to0q);

verifyEvaluate(reggieCompiledToLevel0q, formalRegularExpressions, {
  '': false,
  'r': false,
  'reg': true,
  'Reg': true,
  'Regg': false,
  'Reggie': true,
  'Reggieeeeeee!': true
});

const anyLevel1 = 'a.*y';

const anyCompiledToLevel0qd = evaluate(anyLevel1, transpile1to0qd);

verifyEvaluate(anyCompiledToLevel0qd, formalRegularExpressions, {
  '': false,
  'ay': true,
  'away': true,
  'a!?y': true,
  'a y': true,
  'archaeoastronomy': true,
  'a14y': true,
  'Anthropomorphically': false
});

const phoneNumberLevel1qs = '((1( |-))?`d`d`d( |-))?`d`d`d( |-)`d`d`d`d';
const phoneNumberCompiledToLevel0qs = evaluate(phoneNumberLevel1qs, transpile1to0qs);

verifyEvaluate(phoneNumberCompiledToLevel0qs, formalRegularExpressions, {
  '': false,
  '1234': false,
  '123 4567': true,
  '987-6543': true,
  '416-555-1234': true,
  '1 416-555-0123': true,
  '011-888-888-8888!': false
});

const phoneNumberLevel1qsm = '((1( |-))?`d⊗3( |-))?`d⊗3( |-)`d⊗4';
const phoneNumberCompiledToLevel0qsm = evaluate(phoneNumberLevel1qsm, transpile1to0qsm);

verifyEvaluate(phoneNumberCompiledToLevel0qsm, formalRegularExpressions, {
  '': false,
  '1234': false,
  '123 4567': true,
  '987-6543': true,
  '416-555-1234': true,
  '1 416-555-0123': true,
  '011-888-888-8888!': false
});

verifyEvaluate(phoneNumberLevel1qs, levelOneExpressions, {
  '': false,
  '1234': false,
  '123 4567': true,
  '987-6543': true,
  '416-555-1234': true,
  '1 416-555-0123': true,
  '011-888-888-8888!': false
});

console.log('09-revisiting-product.js');

function productOperation (a, b, setOperator) {
  const {
    states: aDeclaredStates,
    accepting: aAccepting
  } = validatedAndProcessed(a);
  const aStates = [null].concat(aDeclaredStates);

  const {
    states: bDeclaredStates,
    accepting: bAccepting
  } = validatedAndProcessed(b);
  const bStates = [null].concat(bDeclaredStates);

  // P is a mapping from a pair of states (or any set, but in union2 it's always a pair)
  // to a new state representing the tuple of those states
  const P = new StateAggregator();

  const productAB = product(a, b, P);
  const { start, transitions } = productAB;

  const statesAAccepts = new Set(
    aAccepting.flatMap(
      aAcceptingState => bStates.map(bState => P.stateFromSet(aAcceptingState, bState))
    )
  );
  const statesBAccepts = new Set(
    bAccepting.flatMap(
      bAcceptingState => aStates.map(aState => P.stateFromSet(aState, bAcceptingState))
    )
  );

  const allAcceptingStates =
    [...setOperator(statesAAccepts, statesBAccepts)];

  const { stateSet: reachableStates } = validatedAndProcessed(productAB);
  const accepting = allAcceptingStates.filter(state => reachableStates.has(state));

  return { start, accepting, transitions };
}

function setUnion (set1, set2) {
  return new Set([...set1, ...set2]);
}

function union (a, b) {
  return mergeEquivalentStates(
    productOperation(a, b, setUnion)
  );
}

function setIntersection (set1, set2) {
  return new Set(
    [...set1].filter(
      element => set2.has(element)
    )
  );
}

function intersection (a, b) {
  return mergeEquivalentStates(
    productOperation(a, b, setIntersection)
  );
}

function setDifference (set1, set2) {
  return new Set(
    [...set1].filter(
      element => !set2.has(element)
    )
  );
}

function difference (a, b) {
  return mergeEquivalentStates(
    productOperation(a, b, setDifference)
  );
}

const complement =
  s => difference(zeroOrMore(anySymbol()), s);

const characterComplement =
  s => intersection(anySymbol(), complement(s));

const levelTwoExpressions = {
  operators: {
    // formal regular expressions

    '∅': {
      symbol: Symbol('∅'),
      type: 'atomic',
      fn: emptySet
    },
    'ε': {
      symbol: Symbol('ε'),
      type: 'atomic',
      fn: emptyString
    },
    '|': {
      symbol: Symbol('|'),
      type: 'infix',
      precedence: 10,
      fn: union2merged
    },
    '→': {
      symbol: Symbol('→'),
      type: 'infix',
      precedence: 20,
      fn: catenation2
    },
    '*': {
      symbol: Symbol('*'),
      type: 'postfix',
      precedence: 30,
      fn: zeroOrMore
    },

    // level one operators

    '?': {
      symbol: Symbol('?'),
      type: 'postfix',
      precedence: 30,
      fn: zeroOrOne
    },
    '+': {
      symbol: Symbol('+'),
      type: 'postfix',
      precedence: 30,
      fn: oneOrMore
    },
    '.': {
      symbol: Symbol('.'),
      type: 'atomic',
      fn: anySymbol
    },
    '__DIGITS__': {
      symbol: digitsSymbol,
      type: 'atomic',
      fn: anyDigit
    },
    '__WORD__': {
      symbol: wordSymbol,
      type: 'atomic',
      fn: anyWord
    },
    '__WHITESPACE__': {
      symbol: whitespaceSymbol,
      type: 'atomic',
      fn: anyWhitespace
    },

    // level two operators

    '∪': {
      symbol: Symbol('∪'),
      type: 'infix',
      precedence: 10,
      fn: union
    },
    '∩': {
      symbol: Symbol('∩'),
      type: 'infix',
      precedence: 10,
      fn: intersection
    },
    '\\': {
      symbol: Symbol('\\'),
      type: 'infix',
      precedence: 10,
      fn: difference
    },
    '¬': {
      symbol: Symbol('¬'),
      type: 'prefix',
      precedence: 40,
      fn: complement
    },
    '^': {
      symbol: Symbol('^'),
      type: 'prefix',
      precedence: 50,
      fn: characterComplement
    }
  },
  defaultOperator: '→',
  escapedValue (symbol) {
    if (symbol === 'd') {
      return digitsSymbol;
    } else if (symbol === 'w') {
      return wordSymbol;
    } else if (symbol === 's') {
      return whitespaceSymbol;
    } else {
      return symbol;
    }
  },
  toValue (string) {
    return literal(string);
  }
};

// ----------

verifyEvaluate('(a|b|c)|(b|c|d)', levelTwoExpressions, {
  '': false,
  'a': true,
  'b': true,
  'c': true,
  'd': true
});

verifyEvaluate('(a|b|c)∪(b|c|d)', levelTwoExpressions, {
  '': false,
  'a': true,
  'b': true,
  'c': true,
  'd': true
});

verifyEvaluate('(a|b|c)∩(b|c|d)', levelTwoExpressions, {
  '': false,
  'a': false,
  'b': true,
  'c': true,
  'd': false
});

verifyEvaluate('0|1(0|1)*', levelTwoExpressions, {
  '': false,
  'an odd number of characters': false,
  'an even number of characters': false,
  '0': true,
  '10': true,
  '101': true,
  '1010': true,
  '10101': true
});

verifyEvaluate('.(..)*', levelTwoExpressions, {
  '': false,
  'an odd number of characters': true,
  'an even number of characters': false,
  '0': true,
  '10': false,
  '101': true,
  '1010': false,
  '10101': true
});

verifyEvaluate('(0|1(0|1)*)∩(.(..)*)', levelTwoExpressions, {
  '': false,
  'an odd number of characters': false,
  'an even number of characters': false,
  '0': true,
  '10': false,
  '101': true,
  '1010': false,
  '10101': true
});

verifyEvaluate('(a|b|c)\\(b|c|d)', levelTwoExpressions, {
  '': false,
  'a': true,
  'b': false,
  'c': false,
  'd': false
});

verifyEvaluate('.*Braithwaite.*\\.*Reggie Braithwaite.*', levelTwoExpressions, {
  'Braithwaite': true,
  'Reg Braithwaite': true,
  'The Reg Braithwaite!': true,
  'The Notorious Reggie Braithwaite': false,
  'Reggie, but not Braithwaite?': true,
  'Is Reggie a Braithwaite?': true
});

verifyEvaluate('(.*\\.*Reggie )Braithwaite.*', levelTwoExpressions, {
  'Braithwaite': true,
  'Reg Braithwaite': true,
  'The Reg Braithwaite!': true,
  'The Notorious Reggie Braithwaite': false,
  'Reggie, but not Braithwaite?': true,
  'Is Reggie a Braithwaite?': true
});

verifyEvaluate('¬(.*Reggie )Braithwaite.*', levelTwoExpressions, {
  'Braithwaite': true,
  'Reg Braithwaite': true,
  'The Reg Braithwaite!': true,
  'The Notorious Reggie Braithwaite': false,
  'Reggie, but not Braithwaite?': true,
  'Is Reggie a Braithwaite?': true
});

verifyEvaluate('.*¬(Reggie )Braithwaite.*', levelTwoExpressions, {
  'Braithwaite': true,
  'Reg Braithwaite': true,
  'The Reg Braithwaiteb': true,
  'The Notorious Reggie Braithwaite': true,
  'Reggie, but not Braithwaite?': true,
  'Is Reggie a Braithwaite?': true
});

verifyEvaluate('.∩¬(a|b|c)', levelTwoExpressions, {
  '': false,
  'a': false,
  'b': false,
  'c': false,
  'd': true,
  'e': true,
  'f': true,
  'ab': false,
  'abc': false
});

verifyEvaluate('^(a|b|c)', levelTwoExpressions, {
  '': false,
  'a': false,
  'b': false,
  'c': false,
  'd': true,
  'e': true,
  'f': true,
  'ab': false,
  'abc': false
});

console.log('10-equivalence.js');

function alternateExpr(...exprs) {
  const uniques = [...new Set(exprs)];
  const notEmptySets = uniques.filter( x => x !== '∅' );

  if (notEmptySets.length === 0) {
    return '∅';
  } else if (notEmptySets.length === 1) {
    return notEmptySets[0];
  } else {
    return notEmptySets.map(p).join('|');
  }
}

function catenateExpr (...exprs) {
  if (exprs.some( x => x === '∅' )) {
    return '∅';
  } else {
    const notEmptyStrings = exprs.filter( x => x !== 'ε' );

    if (notEmptyStrings.length === 0) {
      return 'ε';
    } else if (notEmptyStrings.length === 1) {
      return notEmptyStrings[0];
    } else {
      return notEmptyStrings.map(p).join('');
    }
  }
}

function zeroOrMoreExpr (a) {
  if (a === '∅' || a === 'ε') {
    return 'ε';
  } else {
    return `${p(a)}*`;
  }
}

function regularExpression (description) {
  const pruned =
    reachableFromStart(
      mergeEquivalentStates(
        description
      )
    );
  const {
    start,
    transitions,
    accepting,
    allStates
  } = validatedAndProcessed(pruned);

  if (accepting.length === 0) {
    return '∅';
  } else {
    const from = start;
    const pathExpressions =
      accepting.map(
        to => expression({ from, to })
      );

    const acceptsEmptyString = accepting.indexOf(start) >= 0;

    if (acceptsEmptyString) {
      return alternateExpr('ε', ...pathExpressions);
    } else {
      return alternateExpr(...pathExpressions);
    }

    function expression({ from, to, viaStates = [...allStates] }) {
      if (viaStates.length === 0) {
        const directExpressions =
          transitions
          .filter( ({ from: tFrom, to: tTo }) => from === tFrom && to === tTo )
          .map( ({ consume }) => toValueExpr(consume) );

        return alternateExpr(...directExpressions);
      } else {
        const [via, ...exceptVia] = viaStates;

        const fromToVia = expression({ from, to: via, viaStates: exceptVia });
        const viaToVia = zeroOrMoreExpr(
          expression({ from: via, to: via, viaStates: exceptVia })
        );
        const viaToTo = expression({ from: via, to, viaStates: exceptVia });

        const throughVia = catenateExpr(fromToVia, viaToVia, viaToTo);
        const notThroughVia = expression({ from, to, viaStates: exceptVia });

        return alternateExpr(throughVia, notThroughVia);
      }
    }
  }
};

function verifyRegularExpression (expression, tests) {
  const recognizer = evaluate(expression, levelTwoExpressions);

  verifyRecognizer(recognizer, tests);

  const formalExpression = regularExpression(recognizer);

  verifyEvaluate(formalExpression, formalRegularExpressions, tests);
}

// ----------

verifyRecognizer(binary, {
  '': false,
  '0': true,
  '1': true,
  '00': false,
  '01': false,
  '10': true,
  '11': true,
  '000': false,
  '001': false,
  '010': false,
  '011': false,
  '100': true,
  '101': true,
  '110': true,
  '111': true,
  '10100011011000001010011100101110111': true
});

const reconstitutedBinaryExpr = regularExpression(binary);

verifyEvaluate(reconstitutedBinaryExpr, formalRegularExpressions, {
  '': false,
  '0': true,
  '1': true,
  '00': false,
  '01': false,
  '10': true,
  '11': true,
  '000': false,
  '001': false,
  '010': false,
  '011': false,
  '100': true,
  '101': true,
  '110': true,
  '111': true,
  '10100011011000001010011100101110111': true
});

verifyRegularExpression('0|1(0|1)*', {
  '': false,
  '0': true,
  '1': true,
  '00': false,
  '01': false,
  '10': true,
  '11': true,
  '000': false,
  '001': false,
  '010': false,
  '011': false,
  '100': true,
  '101': true,
  '110': true,
  '111': true,
  '10100011011000001010011100101110111': true
});

verifyRegularExpression('(a|b|c)∪(b|c|d)', {
  '': false,
  'a': true,
  'b': true,
  'c': true,
  'd': true
});

verifyRegularExpression('(ab|bc|cd)∪(bc|cd|de)', {
  '': false,
  'ab': true,
  'bc': true,
  'cd': true,
  'de': true
});

verifyRegularExpression('(a|b|c)∩(b|c|d)', {
  '': false,
  'a': false,
  'b': true,
  'c': true,
  'd': false
});

verifyRegularExpression('(ab|bc|cd)∩(bc|cd|de)', {
  '': false,
  'ab': false,
  'bc': true,
  'cd': true,
  'de': false
});

verifyRegularExpression('(a|b|c)\\(b|c|d)', {
  '': false,
  'a': true,
  'b': false,
  'c': false,
  'd': false
});

verifyRegularExpression('(ab|bc|cd)\\(bc|cd|de)', {
  '': false,
  'ab': true,
  'bc': false,
  'cd': false,
  'de': false
});


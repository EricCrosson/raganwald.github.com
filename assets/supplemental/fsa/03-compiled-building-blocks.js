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


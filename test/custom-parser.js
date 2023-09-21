const assert = require('assert/strict');
const { Scanner } = require('../src/custom-parser');
const { is, fromJS } = require('immutable');

let code = 'if (a < b) { a } else "b";';
let scanner = new Scanner(code);
let tokens = scanner.scanTokens();

assert(is(
    fromJS([
        {
          "type": "IF",
          "lexeme": "if",
          "literal": null,
          "line": 1
        },
        {
          "type": "LEFT_PAREN",
          "lexeme": "(",
          "literal": null,
          "line": 1
        },
        {
          "type": "SYMBOL",
          "lexeme": "a",
          "literal": null,
          "line": 1
        },
        {
          "type": "LESS",
          "lexeme": "<",
          "literal": null,
          "line": 1
        },
        {
          "type": "SYMBOL",
          "lexeme": "b",
          "literal": null,
          "line": 1
        },
        {
          "type": "RIGHT_PAREN",
          "lexeme": ")",
          "literal": null,
          "line": 1
        },
        {
          "type": "LEFT_BRACE",
          "lexeme": "{",
          "literal": null,
          "line": 1
        },
        {
          "type": "SYMBOL",
          "lexeme": "a",
          "literal": null,
          "line": 1
        },
        {
          "type": "RIGHT_BRACE",
          "lexeme": "}",
          "literal": null,
          "line": 1
        },
        {
          "type": "ELSE",
          "lexeme": "else",
          "literal": null,
          "line": 1
        },
        {
          "type": "STRING",
          "lexeme": "\"b\"",
          "literal": "b",
          "line": 1
        },
        {
          "type": "SEMICOLON",
          "lexeme": ";",
          "literal": null,
          "line": 1
        },
        {
          "type": "EOF",
          "lexeme": "",
          "literal": null,
          "line": 1
        }
      ]),
      fromJS(tokens)
));
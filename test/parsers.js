const assert = require('assert/strict');
const { is, fromJS } = require("immutable");
const { pprint } = require('../src/util');
const { floatParser, symbolParser, booleanParser, stringParser, blockExprParser } = require("../src/parsers");

// numbers
// =======
assert(is(
    -1.7,
    floatParser.parse('-1.7').value.value
));


// symbols
// =======
assert(is(
    '$a_1',
    symbolParser.parse('$a_1').value.value
));


// booleans
// ========
assert(is(
    true,
    booleanParser.parse('true').value.value
));

assert(is(
    false,
    booleanParser.parse('false').value.value
));


// strings
// =======
assert(is(
    'hello',
    stringParser.parse('"hello"').value.value
));


// Block Expression
// ================
assert(is(
    fromJS([
          {
            "type": "boolean",
            "value": true
          },
          {
            "type": "semicolon",
            "value": ";"
          }
        ,
        {
          "type": "block",
          "value": [
              {
                "type": "symbol",
                "value": "a"
              },
              {
                "type": "semicolon",
                "value": ";"
              }
            ]
        },
          {
            "type": "number",
            "value": 5
          },
          {
            "type": "semicolon",
            "value": ";"
          }
        ]),
    fromJS(blockExprParser.parse('{ true; { a; } 5; }').value.value)
))
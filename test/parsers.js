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
  

// binary expressions
// ==================
// pprint(binaryExprParser.parse('a * b + c'));

// assert(is(
//     fromJS({
//       "type": "binary-exp",
//       "value": {
//         "left": {
//           "type": "symbol",
//           "value": "a"
//         },
//         "op": {
//           "type": "binary-op",
//           "value": "+"
//         },
//         "right": {
//           "type": "symbol",
//           "value": "b"
//         }
//       }
//     }),
//     fromJS(binaryExprParser.parse('a - b + c').value)
// ));

// Block Expression
// ================
assert(is(
  fromJS([
    {
      "type": "boolean",
      "value": true
    },
    {
      "type": "block",
      "value": [
        {
          "type": "symbol",
          "value": "a"
        },
      ]
    },
    {
      "type": "number",
      "value": 5
    }
  ]),
  fromJS(blockExprParser.parse('{ true; { a; } 5; }').value.value)
));
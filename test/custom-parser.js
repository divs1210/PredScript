const assert = require('assert/strict');
const { parseExpr, parseSymbol } = require('../src/custom-parser');
const { is, fromJS } = require('immutable');
const { parse } = require('path');

// numbers
// =======
assert(is(
    1,
    parseExpr('1').value.value
))


// symbols
// =======
assert(is(
    'a1b',
    parseExpr('a1b').value.value
));


// booleans
// ========
assert(is(
    false,
    parseExpr('false').value.value
));


// strings
// =======
assert(is(
    'hello',
    parseExpr('"hello"').value.value
));


// Block Expresssion
// =================
assert(is(
    fromJS([
        { type: 'number',    value: 1     },
        { type: 'symbol',    value: 'abc' },
        { type: 'boolean',   value: false }
      ]),
    fromJS(parseExpr('{ 1; abc; false;  }').value.value)
));

// let code = 'f( if (a < b) { 1; 2 } else "b" )';
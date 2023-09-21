const assert = require('assert/strict');
const { parseExpr, parseSymbol } = require('../src/custom-parser');
const { is } = require('immutable');

assert(is(
    1,
    parseExpr('1').value.value
))

console.log(parseExpr('a1b'));

assert(is(
    'a1b',
    parseExpr('a1b').value.value
));

// let code = 'f( if (a < b) { 1 } else "b" )';
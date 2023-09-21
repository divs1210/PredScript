const assert = require('assert/strict');
const { is } = require("immutable");
const { floatParser, symbolParser, booleanParser, stringParser } = require("../src/parsers");

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
console.log(stringParser.parse('"hello"'));

assert(is(
    'hello',
    stringParser.parse('"hello"').value.value
));
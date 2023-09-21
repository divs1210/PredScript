const assert = require('assert/strict');
const { is } = require("immutable");
const { floatParser, symbolParser } = require("../src/parsers");

assert(is(
    -1.7,
    floatParser.parse('-1.7').value.value
));

console.log(symbolParser.parse('$a_1'))

assert(is(
    '$a_1',
    symbolParser.parse('$a_1').value.value
));

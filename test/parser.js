const assert = require('node:assert/strict');
const { parse } = require("../src/parser");
const { is } = require('immutable');
const { prettify } = require('../src/util');

assert(is(
    1.5,
    parse('1.5')?.expression?.value
));

assert(is(
    'ArrowFunctionExpression',
    parse('() => null')?.expression?.type
));
const assert = require('node:assert/strict');
const { parseExpr } = require("../src/parser");
const { is } = require('immutable');
const { pprint } = require('../src/util');

assert(is(
    1.5,
    parseExpr('1.5')?.expression?.value
));

assert(is(
    'ArrowFunctionExpression',
    parseExpr('() => null')?.expression?.type
));

assert(is(
    'ArrowFunctionExpression',
    parseExpr('(x) => null')?.expression?.type
));

assert(is(
    'ArrowFunctionExpression',
    parseExpr('() => x')?.expression?.type
));

assert(is(
    'ArrowFunctionExpression',
    parseExpr('(x) => x')?.expression?.type
));
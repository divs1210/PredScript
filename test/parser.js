const assert = require('node:assert/strict');
const { parse } = require('../src/parser.js');
const { Map, is } = require('immutable');

assert(is(
    Map({
        type: 'number',
        val: 5
    }),
    parse('5')
));

assert(is(
    Map({
        type: 'number',
        val: 5.5
    }),
    parse('5.5')
));
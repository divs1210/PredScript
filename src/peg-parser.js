const fs = require('fs');
const peg = require("pegjs");
const { pprint } = require('./util');

const grammar = fs.readFileSync('src/grammar.pegjs', 'utf8');
const parse = peg.generate(grammar).parse;

pprint(parse(`function f(a: int, b: int, c: bool) {}`));

let parseExpr = null;

module.exports = {
    parse,
    parseExpr
};
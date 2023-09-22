const fs = require('fs');
const peg = require("pegjs");
const { pprint } = require('./util');

const grammar = fs.readFileSync('src/grammar.pegjs', 'utf8');
const parse = peg.generate(grammar).parse;

pprint(parse(`f(1, 2)`));

let parseExpr = null;

module.exports = {
    parse,
    parseExpr
};
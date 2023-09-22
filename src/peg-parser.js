const fs = require('fs');
const peg = require("pegjs");
const { pprint } = require('./util');

const grammar = fs.readFileSync('src/grammar.pegjs', 'utf8');
const parse = peg.generate(grammar).parse;

// pprint(parse(`if (a < b) a else if (b < c) b else c`));

let parseExpr = null;

module.exports = {
    parse,
    parseExpr
};
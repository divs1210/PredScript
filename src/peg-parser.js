const fs = require('fs');
const peg = require("pegjs");

const grammar = fs.readFileSync('src/grammar.pegjs', 'utf8');
const parse = peg.generate(grammar).parse;
let parseExpr = (code) => parse(code).value[0];

module.exports = {
    parse,
    parseExpr
};
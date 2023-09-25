const fs = require('fs');
const peg = require("pegjs");

const grammar = fs.readFileSync('src/grammar.pegjs', 'utf8');
const _parse = peg.generate(grammar).parse;

const stripComments = (code) =>
    code
    .split(/[\n\r]/)
    .map(line => line.replace(/\/\/.*/, ''))
    .join('\n');

const parse = (code) => _parse(stripComments(code));
const parseExpr = (code) => parse(code).value[0];

module.exports = {
    parse,
    parseExpr
};
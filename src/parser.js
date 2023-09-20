const TSParser = require('@typescript-eslint/parser');

const parse = (code) => 
    TSParser.parseForESLint(code, {loc: true}).ast;

const parseExpr = (code) =>
    parse(code).body[0];

module.exports = {
    parse,
    parseExpr
};
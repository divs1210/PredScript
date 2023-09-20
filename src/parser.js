const TSParser = require('@typescript-eslint/typescript-estree');

const parse = (code) => 
    TSParser.parse(code, {loc: true, range: true});

const parseExpr = (code) =>
    parse(code).body[0];

module.exports = {
    parse,
    parseExpr
};
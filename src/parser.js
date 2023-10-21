// run: $ pegjs src/grammar.pegjs
// to generate  src/grammar.js
const parser = require('./grammar');

const parse = (code) => parser.parse(code);
const parseExpr = (code) => parse(code).value[0];

module.exports = {
    parse,
    parseExpr
};
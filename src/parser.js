// run: $ pegjs src/grammar.pegjs
// to generate  src/grammar.js
const _parser = require('./grammar');
const _parse = _parser.parse;

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
const TSParser = require('@typescript-eslint/parser');

const parse = (code) => 
    TSParser.parseForESLint(code).ast;

module.exports = {
    parse
};
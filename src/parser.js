const TSParser = require('@typescript-eslint/parser');

const parse = (code) => 
    TSParser.parseForESLint(code).ast.body[0];

module.exports = {
    parse
};
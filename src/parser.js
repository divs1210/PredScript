const TSParser = require('@typescript-eslint/parser');

const parse = (code) => 
    TSParser.parseForESLint(code, {loc: true}).ast.body[0];

module.exports = {
    parse
};
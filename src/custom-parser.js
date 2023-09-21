const combinators = require("parjs/combinators");
const { floatParser, symbolParser, booleanParser, stringParser, blockExprParser, binaryExprParser } = require("./parsers");
const { whitespace } = require('parjs');

const exprParser =
    // numbers
    floatParser
    // booleans
    .pipe(combinators.or(booleanParser))
    // symbols
    .pipe(combinators.or(symbolParser))
    // strings
    .pipe(combinators.or(stringParser))
    // binary expressions
    .pipe(combinators.or(binaryExprParser))
    // block expressions
    .pipe(combinators.or(blockExprParser))
    // allow extra spaces
    .pipe(combinators.between(whitespace()));

module.exports = {
    parseExpr: (code) => exprParser.parse(code)
};
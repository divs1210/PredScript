const combinators = require("parjs/combinators");
const { floatParser, symbolParser, booleanParser, stringParser, blockExprParser, binaryExprParser, ifElseParser } = require("./parsers");
const { whitespace } = require('parjs');

const exprParser =
    // binary expressions
    binaryExprParser
    // block expressions
    .pipe(combinators.or(blockExprParser))
    // if / else expressions
    .pipe(combinators.or(ifElseParser))
    // numbers
    .pipe(combinators.or(floatParser))
    // booleans
    .pipe(combinators.or(booleanParser))
    // symbols
    .pipe(combinators.or(symbolParser))
    // strings
    .pipe(combinators.or(stringParser))
    
    // allow extra spaces
    .pipe(combinators.between(whitespace()));

module.exports = {
    parseExpr: (code) => exprParser.parse(code)
};
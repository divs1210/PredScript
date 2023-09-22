const combinators = require("parjs/combinators");
const { floatParser, symbolParser, booleanParser, stringParser, blockExprParser, binaryExprParser, ifElseParser, fnCallParser } = require("./parsers");
const { whitespace } = require('parjs');

const exprParser =
    // fn calls
    fnCallParser
    // binary expressions
    .pipe(combinators.or(binaryExprParser))
    // block expressions
    .pipe(combinators.or(blockExprParser))
    // 
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
const combinators = require("parjs/combinators");
const { floatParser, symbolParser, booleanParser, stringParser } = require("./parsers");

const exprParser =
    // numbers
    floatParser
    // booleans
    .pipe(combinators.or(booleanParser))
    // symbols
    .pipe(combinators.or(symbolParser))
    // strings
    .pipe(combinators.or(stringParser));

module.exports = {
    parseExpr: (code) => exprParser.parse(code)
};
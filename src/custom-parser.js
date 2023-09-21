const combinators = require("parjs/combinators");
const { floatParser, symbolParser, booleanParser } = require("./parsers");

const exprParser =
    // numbers
    floatParser
    // booleans
    .pipe(combinators.or(booleanParser))
    // symbols
    .pipe(combinators.or(symbolParser));

module.exports = {
    parseExpr: (code) => exprParser.parse(code)
};
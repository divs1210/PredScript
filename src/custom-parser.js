const combinators = require("parjs/combinators");
const { floatParser, symbolParser } = require("./parsers");

const exprParser =
    // numbers
    floatParser
    // symbols
    .pipe(combinators.or(symbolParser));

module.exports = {
    parseExpr: (code) => exprParser.parse(code)
};
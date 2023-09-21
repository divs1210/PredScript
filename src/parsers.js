const { Set } = require("immutable");
const parsers = require("parjs");
const combinators = require("parjs/combinators");

// wrappers
// ========
// numbers
const floatParser = 
    parsers.float()
    .pipe(combinators.map(res => {
        return {
            'type' : 'number',
            'value': res
        };
    }));

// symbols
const whiteSpaceChars = Set([' ', '\n', '\t', 'r']);

const firstCharOfSymbolParser =
    parsers.letter()
    .pipe(combinators.or(parsers.anyCharOf('$_')));

const restCharsOfSymbolParser =
    firstCharOfSymbolParser
    .pipe(combinators.or(parsers.digit()))
    .pipe(combinators.many());

const symbolParser =
    firstCharOfSymbolParser
    .pipe(combinators.then(restCharsOfSymbolParser))
    .pipe(combinators.map(res => {
        return {
            type:  'symbol',
            value: res[0] + res[1].join('')
        };
    }));


module.exports = {
    floatParser,
    symbolParser
};
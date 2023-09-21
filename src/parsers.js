const { Set } = require("immutable");
const parsers = require("parjs");
const combinators = require("parjs/combinators");

// numbers
// =======
const floatParser = 
    parsers.float()
    .pipe(combinators.map(res => {
        return {
            'type' : 'number',
            'value': res
        };
    }));


// symbols
// =======
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


// booleans
// ========
const booleanParser =
    parsers.string('true')
    .pipe(combinators.or(parsers.string('false')))
    .pipe(combinators.map(res => {
        return {
            type: 'boolean',
            value: res == 'true' ? true : false
        }
    }));


// strings
// =======
const stringParser =
    parsers.noCharOf('"')
    .pipe(combinators.many())
    .pipe(combinators.between('"', '"'))
    .pipe(combinators.map(res => {
        return {
            type: 'string',
            value: res.join('')
        }
    }));


// literal expression
// ==================
const literalExprParser =
    floatParser
    .pipe(combinators.or(booleanParser))
    .pipe(combinators.or(symbolParser))
    .pipe(combinators.or(stringParser));


// block expression
// ================
const spacedSemicolon =
    parsers.string(';')
    .pipe(combinators.between(parsers.whitespace()))
    .pipe(combinators.map(res => {
        return {
            type: 'semicolon',
            value: res
        }
    }));

const _blockExprParser =
    literalExprParser
    .pipe(combinators.then(spacedSemicolon))
    .pipe(combinators.between(parsers.whitespace()))
    .pipe(combinators.many())
    .pipe(combinators.between('{', '}'))
    .pipe(combinators.map(res => {
        return {
            type: 'block',
            value: res.flat(1).filter((node) => node.type !== 'semicolon')
        }
    }));

const blockExprParser =
    literalExprParser
    .pipe(combinators.then(spacedSemicolon))
    .pipe(combinators.or(_blockExprParser))
    .pipe(combinators.between(parsers.whitespace()))
    .pipe(combinators.many())
    .pipe(combinators.between('{', '}'))
    .pipe(combinators.map(res => {
        return {
            type: 'block',
            value: res.flat(1).filter((node) => node.type !== 'semicolon')
        }
    }));


module.exports = {
    floatParser,
    symbolParser,
    booleanParser,
    stringParser,
    blockExprParser
};
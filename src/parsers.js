const { Set } = require("immutable");
const parsers = require("parjs");
const combinators = require("parjs/combinators");
const { pprint } = require("./util");

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

const spacedLiteralParser =
    literalExprParser
    .pipe(combinators.between(parsers.whitespace()));


// function calls
// ==============
const fnCallParser =
    spacedLiteralParser
    .pipe(combinators.then(
        spacedLiteralParser
        .pipe(combinators.manySepBy(','))
        .pipe(combinators.between(parsers.whitespace()))
        .pipe(combinators.between('(', ')'))
        .pipe(combinators.between(parsers.whitespace()))
    ))
    .pipe(combinators.map(res => {
        return {
            type:  'fn-call',
            value: {
                f:    res[0],
                args: res[1]
            }
        }
    }));


// binary expression
// =================
const binaryOpParser =
    parsers.anyStringOf(
        "+", "-", "*", "/",
        '<', '>',
        '==', '<=', '>=',
        "&&", "||"
    ).pipe(combinators.map(res => {
        return {
            type: 'binary-op',
            value: res
        };
    }));

// fully parenthesized exprs only
const binaryExprParser =
    spacedLiteralParser
    .pipe(combinators.then(binaryOpParser))
    .pipe(combinators.then(spacedLiteralParser))
    .pipe(combinators.between('(', ')'))
    .pipe(combinators.map(res => {
        let [left, op, right] = res.flat(1);
        return {
            type:  'binary-expr',
            value: { left, op, right }
        };
    }));


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
    spacedLiteralParser
    .pipe(combinators.or(binaryExprParser))
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
    spacedLiteralParser
    .pipe(combinators.or(binaryExprParser))
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


// if / else
// =========
const ifParser =
    parsers.string('if')
    .pipe(combinators.between(parsers.whitespace()));

const elseParser =
    parsers.string('else')
    .pipe(combinators.between(parsers.whitespace()));

const condParser =
    binaryExprParser
    .pipe(combinators.or(
        spacedLiteralParser
        .pipe(combinators.between('(', ')'))
        .pipe(combinators.between(parsers.whitespace()))
    ));

const thenParser =
    blockExprParser
    .pipe(combinators.or(binaryExprParser))
    .pipe(combinators.or(spacedLiteralParser))
    .pipe(combinators.between(parsers.whitespace()))

// only if / else, no else if
const ifElseParser =
    ifParser
    .pipe(combinators.then(condParser))
    .pipe(combinators.then(thenParser))
    .pipe(combinators.then(
        elseParser
        .pipe(combinators.then(thenParser))
    ))
    .pipe(combinators.map(res => {
        let [cond, then, _else] = 
            [res[0][0][1], res[0][1], res[1][1]];
        return {
            type: 'if',
            cond: cond,
            then: then,
            else: _else
        };
    }));


module.exports = {
    floatParser,
    symbolParser,
    booleanParser,
    stringParser,
    binaryExprParser,
    blockExprParser,
    ifElseParser,
    fnCallParser
};
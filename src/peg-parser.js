const fs = require('fs');
const peg = require("pegjs");
const { pprint } = require('./util');

const grammar = fs.readFileSync('src/grammar.pegjs', 'utf8');
const parse = peg.generate(grammar).parse;

pprint(parse(`
let c = 1

function fact(n: real) {
    if (n < 2) 
        "ahsdx"
    else
        n * fact(n - 1)
}

add(1, add(w, 3+2));
`));

let parseExpr = null;

module.exports = {
    parse,
    parseExpr
};
const fs = require('fs');
const peg = require("pegjs");
const { pprint, slurp } = require('./util');

const grammar = fs.readFileSync('src/grammar.pegjs', 'utf8');
const parse = peg.generate(grammar).parse;

pprint(parse(`
let c = 1;

function add(a: int, b: real) {
    a + b * c;
}

add(1, add(w, 3+2));
`));

module.exports = {
    parse
};
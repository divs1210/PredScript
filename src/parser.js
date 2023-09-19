const peg = require('pegjs');
const path = require('path');
const fs = require('fs');
const { Map } = require('immutable');

const fileName = path.join(__dirname, '.', 'parser.pegjs');
const grammar = fs.readFileSync(fileName, 'utf8');
const { parse: pegParse } = peg.generate(grammar);

function makeNumber(arr) {
  return Map({
    type: 'number',
    val:  parseFloat(arr.join(''))
  });
}

function makeSymbol(arr) {
  return Map({
    type: 'symbol',
    val:  arr[0].join('')
  });
}

const parse = (code) => pegParse(code, {
  makeNumber,
  makeSymbol
});

module.exports = {
  parse
};
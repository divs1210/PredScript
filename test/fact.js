const assert = require('node:assert/strict');
const {is} = require('immutable');
const {
    Real, isReal,
    List,
    MultiFn, Implement, _apply,
    isLessThanEq, TRUE,
    times, sub
} = require('../src/builtins.js');


let fact = MultiFn("fact");

Implement(
    fact,
    List([isReal]),
    isReal,
    (x) => {
        let lessThanEqOne = _apply(isLessThanEq, List([x, Real(1)]));
        if (is(TRUE, lessThanEqOne)) {
            return Real(1);
        } else {
            let decX = _apply(sub, List([x, Real(1)]));
            let factDecX = _apply(fact, List([decX]));
            return _apply(times, List([x, factDecX]));
        }
    }
);

console.log(_apply(fact, List([Real(5)])).get('val').toNumber());

assert(is(
    120,
    _apply(fact, List([Real(5)])).get('val').toNumber()
));
const assert = require('node:assert/strict');
const {is} = require('immutable');
const {isNull} = require('../src/util.js');
const {
    Real, isReal,
    List,
    MultiFn, Implement, _apply,
    isLessThanEq, TRUE,
    times, sub
} = require('../src/builtins.js');


// (defn [isReal fact]
//   [[isReal x]]
//   (if (<= n 1)
//     1
//     (* n (fact (- n 1)))))
// ==========================
if(isNull(globalThis.fact))
    globalThis.fact = MultiFn("fact");

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
// ==========================

assert(is(
    Real(120), 
    _apply(fact, List([Real(5)]))
));
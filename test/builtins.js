const assert = require('node:assert/strict');
const {is: _is} = require('immutable');
const {
    isPred, type, 
    isReal, Real, 
    MultiFn, Implement, _apply, apply,
    add, sub, times, 
    is, isBool, Bool, isLessThanEq,
    isList, List, TRUE, FALSE, isAny 
} = require('../src/builtins.js');
const { val } = require('../src/util.js');


// Predicates
// ==========
let _isPred = isPred.get('val');
assert(_isPred(isPred));
assert(_is(isPred, type(isPred)));


// Real Numbers
// ============
let _isReal = isReal.get('val');
assert(_isPred(isReal));
assert(_is(isReal, type(Real(1))))


// List
// ====
assert(_isPred(isList));
assert(_is(isList, type(List([1]))));


// apply
// =====
assert(_is(
    Real(3),
    _apply(add, List([
        Real(1),
        Real(2)
    ]))
));

Implement(
    apply,
    List([isList, isReal]),
    isReal,
    (xs, idx) => {
        let jsXs  = val(xs);
        let bigNumberIdx = val(idx);
        let jsIdx = bigNumberIdx.toNumber();
        return jsXs.get(jsIdx);
    }
);

// TODO: update compiler
// f(x, y) => _apply(apply, [f, [x, y]])
assert(_is(
    Real(12),
    _apply(
        apply, 
        List([
            List([
                Real(10),
                Real(11),
                Real(12)
            ]),
            Real(2)
        ])
    )
));


// MultFn
// ======
let inc = MultiFn('inc');
Implement(
    inc,
    List([isReal]),
    isReal,
    (x) => _apply(
        add,
        List([x, Real(1)])
    )
);
assert(_is(
    Real(2),
    _apply(inc, List([Real(1)]))
));


// Arithmetic
// ==========
assert(_is(
    Real(3),
    _apply(add, List([Real(1), Real(2)]))
));

assert(_is(
    Real(-1),
    _apply(sub, List([Real(1), Real(2)]))
));

assert(_is(
    Real(6),
    _apply(times, List([Real(2), Real(3)]))
));


// Boolean
// =======
let _isBool = isBool.get('val');
assert(isPred, isBool);
assert(_is(
    isBool,
    type(TRUE)
));


// Logic
// =====
assert(_is(
    TRUE,
    _apply(is, List([Real(1), Real(1)]))
));

assert(_is(
    FALSE,
    _apply(is, List([Real(1), Real(2)]))
));

assert(_is(
    TRUE,
    _apply(isLessThanEq, List([Real(1), Real(2)]))
));

assert(_is(
    TRUE,
    _apply(isLessThanEq, List([Real(1), Real(1)]))
));

assert(_is(
    FALSE,
    _apply(isLessThanEq, List([Real(2), Real(1)]))
));
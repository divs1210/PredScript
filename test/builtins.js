const assert = require('node:assert/strict');
const {is: _is} = require('immutable');
const {
    isPred, type, 
    isReal, Real, 
    MultiFn, Implement, apply, 
    add, sub, times, 
    is, isBool, Bool, isLessThanEq,
    isList, List, TRUE, FALSE
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
    apply(add, List([
        Real(1),
        Real(2)
    ]))
));


// MultFn
// ======
let inc = MultiFn('inc');
Implement(
    inc,
    List([isReal]),
    isReal,
    (x) => apply(
        add,
        List([x, Real(1)])
    )
);
assert(_is(
    Real(2),
    apply(inc, List([Real(1)]))
));


// Arithmetic
// ==========
assert(_is(
    Real(3),
    apply(add, List([Real(1), Real(2)]))
));

assert(_is(
    Real(-1),
    apply(sub, List([Real(1), Real(2)]))
));

assert(_is(
    Real(6),
    apply(times, List([Real(2), Real(3)]))
));


// Boolean
// =======
let _isBool = isBool.get('val');
assert(isPred, isBool);
assert(_is(
    isBool,
    type(Bool(true))
));


// Logic
// =====
assert(_is(
    TRUE,
    apply(is, List([Real(1), Real(1)]))
));

assert(_is(
    FALSE,
    apply(is, List([Real(1), Real(2)]))
));

assert(_is(
    Bool(true),
    apply(isLessThanEq, List([Real(1), Real(2)]))
));

assert(_is(
    Bool(true),
    apply(isLessThanEq, List([Real(1), Real(1)]))
));

assert(_is(
    Bool(false),
    apply(isLessThanEq, List([Real(2), Real(1)]))
));
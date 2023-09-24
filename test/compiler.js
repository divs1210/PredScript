const assert = require('assert/strict');
const { compileExpr } = require('../src/compiler.js');
const { is } = require('immutable');

// numbers
// =======
assert(is(
    'Int(123)',
    compileExpr('123')
));

assert(is(
    'Real(1.5)',
    compileExpr('1.5')
));


// booleans
// ========
assert(is(
    'Bool(true)',
    compileExpr('true')
));

assert(is(
    'Bool(false)',
    compileExpr('false')
));


// Infix ops
// =========
assert(is(
    '_apply(times, List([a, b]))',
    compileExpr('a * b')
));

assert(is(
    '_apply(add, List([a, _apply(times, List([b, c]))]))',
    compileExpr('a + b * c')
));

assert(is(
    '_apply(isLessThanEq, List([a, b]))',
    compileExpr('a <= b')
));


// function calls
// ==============
assert(is(
    '_apply(apply, List([f, List([a, b])]))',
    compileExpr('f(a, b)')
));


// Complex expressions
// ===================
assert(is(
    '_apply(times, List([n, _apply(apply, List([fact, List([_apply(minus, List([n, Int(1)]))])]))]))',
    compileExpr('n * fact(n - 1)')
));


// Block expressions
// =================
assert(is(
    '((() => { _apply(apply, List([a, List([])])); return _apply(apply, List([b, List([])])); })())',
    compileExpr(`{
        a();
        b();
    }`)
));


// if / else
// =========
assert(is(
    '(_is(TRUE, (_apply(isLessThan, List([a, b]))))? (a): (null))',
    compileExpr('if (a < b) a')
));

assert(is(
    '(_is(TRUE, (_apply(isLessThan, List([a, b]))))? (a): (b))',
    compileExpr('if (a < b) { a } else { b }')
));

assert(is(
    '(_is(TRUE, (_apply(isLessThan, List([a, b]))))? (a): ((_is(TRUE, (_apply(isLessThan, List([b, c]))))? (b): (c))))',
    compileExpr(`
        if (a < b) a 
        else if (b < c) b 
        else c
    `)
));


// MultiFns
// ========
assert(is(
    `
var inc = inc || MultiFn("inc");
Implement(
    inc,
    List([isInt]),
    isInt,
    (x) => _apply(add, List([x, Int(1)]))
);
    `.trim(),
    compileExpr(`
function inc(x: isInt): isInt {
    x + 1;
}
    `)
));


// Let stmt
// ========
assert(is(
    'let a = as(isReal, Real(1.2));',
    compileExpr('let a: isReal = 1.2;')
));
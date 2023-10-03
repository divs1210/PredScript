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
    '_apply(times, List(Int(1), Int(2)))',
    compileExpr('1 * 2')
));

assert(is(
    '_apply(add, List(Int(1), _apply(times, List(Int(2), Int(3)))))',
    compileExpr('1 + 2 * 3')
));

assert(is(
    '_apply(isLessThanEq, List(Int(1), Int(2)))',
    compileExpr('1 <= 2')
));


// function calls
// ==============
assert(is(
    '_apply(apply, List(add, List(Int(1), Int(2))))',
    compileExpr('add(1, 2)')
));


// Complex expressions
// ===================
assert(is(
    '_apply(times, List(Int(5), _apply(apply, List(minus, List(Int(5), Int(1))))))',
    compileExpr('5 * minus(5, 1)')
));


// Block expressions
// =================
assert(is(
    '((() => { Int(1); return Int(2); })())',
    compileExpr(`{
        1;
        2;
    }`)
));


// if / else
// =========
assert(is(
    '(_is(TRUE, (_apply(isLessThan, List(Int(1), Int(2)))))? (Int(1)): (null))',
    compileExpr('if (1 < 2) 1')
));

assert(is(
    '(_is(TRUE, (_apply(isLessThan, List(Int(1), Int(2)))))? (((() => { ; return Int(1); })())): (((() => { ; return Int(2); })())))',
    compileExpr('if (1 < 2) { 1 } else { 2 }')
));

assert(is(
    '(_is(TRUE, (_apply(isLessThan, List(Int(1), Int(2)))))? (Int(1)): ((_is(TRUE, (_apply(isLessThan, List(Int(2), Int(3)))))? (Int(2)): (Int(3)))))',
    compileExpr(`
        if (1 < 2) 1 
        else if (2 < 3) 2 
        else 3
    `)
));


// MultiFns
// ========
assert(is(`
var inc = inc || MultiFn("inc");
Implement(
    inc,
    List(isInt),
    isInt,
    (x) => ((() => { ; return _apply(add, List(x, Int(1))); })())
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
assert(is(`
((() => { 
                ;
                return ((function (a) {
                    return null;
                })(_check(isReal, Real(1.2))));
            })())
    `.trim(),
    compileExpr('{ let a: isReal = 1.2; }')
));
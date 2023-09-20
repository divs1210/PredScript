const assert = require('assert/strict');
const { compile } = require('../src/compiler.js');
const { is } = require('immutable');

// numbers
// =======
assert(is(
    'Real(1)',
    compile('1')
));

assert(is(
    'Real(1.5)',
    compile('1.5')
));


// booleans
// ========
assert(is(
    'Bool(true)',
    compile('true')
));

assert(is(
    'Bool(false)',
    compile('false')
));


// Infix ops
// =========
assert(is(
    'apply(times, List([a, b]))',
    compile('a * b')
));

assert(is(
    'apply(add, List([a, apply(times, List([b, c]))]))',
    compile('a + b * c')
));

assert(is(
    'apply(isLessThanEq, List([a, b]))',
    compile('a <= b')
));


// function calls
// ==============
assert(is(
    'apply(add, List([a, b]))',
    compile('add(a, b)')
));


// Complex expressions
// ===================
assert(is(
    'apply(times, List([n, apply(fact, List([apply(sub, List([n, Real(1)]))]))]))',
    compile('n * fact(n - 1)')
));


// Block expressions
// =================
assert(is(
    '((() => { apply(a, List([])); return apply(b, List([])); })())',
    compile(`{
        a();
        b();
    }`)
));


// if / else
// =========
assert(is(
    '(is(TRUE, (apply(isLessThan, List([a, b]))))? (a): (null))',
    compile('if (a < b) a')
));

assert(is(
    '(is(TRUE, (apply(isLessThan, List([a, b]))))? (a): (b))',
    compile('if (a < b) { a } else { b }')
));

assert(is(
    '(is(TRUE, (apply(isLessThan, List([a, b]))))? (a): ((is(TRUE, (apply(isLessThan, List([b, c]))))? (b): (c))))',
    compile(`
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
    List([isReal]),
    isReal,
    (x) => apply(add, List([x, Real(1)]))
);
    `.trim(),
    compile(`
function inc(x: isReal): isReal {
    x + 1;
}
    `)
));
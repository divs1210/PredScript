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
    'Real(1.0)',
    compile('1.0')
));


// booleans
// ========
assert(is(
    'TRUE',
    compile('true')
));

assert(is(
    'FALSE',
    compile('false')
));


// Infix ops
// =========
assert(is(
    'times(a, b)',
    compile('a * b')
));

assert(is(
    'isLessThanEq(a, b)',
    compile('a <= b')
));


// complex expressions
// ===================
assert(is(
    'times(n, fact(sub(n, Real(1))))',
    compile('n * fact(n - 1)')
));


// if / else
// =========
assert(is(
    '((is(TRUE, isLessThan(a, b)))? (a) : null)',
    compile('if (a < b) a')
));

assert(is(
    '((is(TRUE, isLessThan(a, b)))? (a) : (b))',
    compile('if (a < b) a else b')
));


// MultiFns
// ========
assert(is(
    `
if(isNull(globalThis.inc)) {
    globalThis.inc = MultiFn("inc");
}

Implement(
    inc,
    List([isReal]),
    isReal,
    (x) => { add(x, 1) }
);
    `.trim(),
    compile(`
function inc(x: isReal): isReal {
    return x + 1;
}
    `)
));
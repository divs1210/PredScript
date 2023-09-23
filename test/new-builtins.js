const assert = require('assert/strict');
const { derive, MultiMethod } = require('../src/new-builtins');
const { Map, List, is } = require('immutable');
const { val } = require('../src/util');

// types
// =====
let isReal = {name: 'real'};
let isInt  = {name: 'int'};
let isEven = {name: 'even'};
let isBool = {name: 'bool'};

// hierarchy
// =========
derive(isReal, isInt);
derive(isInt, isEven);


// vars
// ====
let realVar = Map({
    val: 3,
    meta: Map({type: isReal})
});

let intVar = Map({
    val: 1,
    meta: Map({type: isInt})
});

let evenVar = Map({
    val: 2,
    meta: Map({type: isEven})
});


// multimethod
// ===========
let foo = new MultiMethod('foo');

assert.throws(() => {
    foo(intVar, evenVar)
}, "call default impl when no impls");


// implement for (real, real)
// ==========================
foo.implementFor(List(
    [isReal, isReal]),
    isReal,
    (x, y) => {
    return new Map({
        val: val(x) + val(y),
        meta: Map({
            type: isReal, 
            impl: 'real, real'
        })
    });
});

assert(is(
    Map({
        val: 3,
        meta: Map({
            type: isReal, 
            impl: 'real, real'
        })
    }),
    foo(intVar, evenVar)
));

assert.throws(() => {
    let boolVar = Map({
        val: true,
        meta: Map({type: isBool})
    });

    foo(intVar, boolVar);
}, "default called when no matching impl");


// impl foo for (int, real)
// ========================
foo.implementFor(List(
    [isInt, isReal]), 
    isReal,
    (x, y) => {
    return Map({
        val: val(x) + val(y),
        meta: Map({ 
            type: isReal, 
            impl: 'int, real' 
        })
    });
});

assert(is(
    Map({
        val: 3,
        meta: Map({
            type: isReal,
            impl: 'int, real'
        })
    }),
    foo(intVar, evenVar)
));


// impl foo for (real, int)
// ========================
foo.implementFor(List(
    [isReal, isInt]), 
    isReal,
    (x, y) => {
    return Map({
        val: val(x) + val(y),
        meta: Map({ 
            type: isReal, 
            impl: 'real, int' 
        })
    });
});

assert(is(
    Map({
        val: 4,
        meta: Map({
            type: isReal,
            impl: 'real, int'
        })
    }),
    foo(realVar, intVar)
));


// throw on ambiguity
// ==================
assert.throws(() => {
    foo(intVar, intVar)
}, 'ambiguous: (int, real) or (real, int)');
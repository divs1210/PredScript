const assert = require('assert/strict');
const { derive, MultiMethod } = require('../src/multi');
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
    meta: {type: isReal}
});

let intVar = Map({
    val: 1,
    meta: {type: isInt}
});

let evenVar = Map({
    val: 2,
    meta: {type: isEven}
});


// multimethod
// ===========
let _type = obj => obj.get('meta').type;
let foo = new MultiMethod('foo', _type);

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
        meta: {
            type: isReal, 
            impl: 'real, real'
        }
    });
});

assert(is(
    'real, real',
    foo(intVar, evenVar).get('meta').impl
));

assert.throws(() => {
    let boolVar = Map({
        val: true,
        meta: { type: isBool }
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
        meta: { 
            type: isReal, 
            impl: 'int, real' 
        }
    });
});

assert(is(
    'int, real',
    foo(intVar, evenVar).get('meta').impl
));


// impl foo for (real, int)
// ========================
foo.implementFor(List(
    [isReal, isInt]), 
    isReal,
    (x, y) => {
    return Map({
        val: val(x) + val(y),
        meta: { 
            type: isReal, 
            impl: 'real, int' 
        }
    });
});

assert(is(
    'real, int',
    foo(realVar, intVar).get('meta').impl
));


// throw on ambiguity
// ==================
assert.throws(() => {
    foo(intVar, intVar)
}, 'ambiguous: (int, real) or (real, int)');


// overwrite existing impl
// =======================
foo.implementFor(List(
    [isReal, isReal]),
    isReal,
    () => {
    return new Map({
        val: 0,
        meta: {
            type: isReal, 
            impl: 'new real, real'
        }
    });
});

assert(is(
    'new real, real',
    foo(realVar, realVar).get('meta').impl
));
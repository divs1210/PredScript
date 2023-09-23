const assert = require('assert/strict');
const { derive, MultiMethod } = require('../src/new-multi');
const { Map, List, is, fromJS } = require('immutable');
const { pprint } = require('../src/util');

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
let x = Map({
    val: 1,
    meta: Map({type: isInt})
});

let y = Map({
    val: 2,
    meta: Map({type: isEven})
});


// multimethod
// ===========
let foo = new MultiMethod('foo');

assert.throws(() => {
    foo(x, y)
}, "call default impl when no impls");


// implement for (real, real)
// ==========================
foo.implementFor(List([isReal, isReal]), (x, y) => {
    return new Map({
        val: x.get('val') + y.get('val'),
        meta: Map({type: isReal})
    });
});

assert(is(
    Map({
        val: 3,
        meta: Map({type: isReal})
    }),
    foo(x, y)
), "(int, even) -> real");

assert.throws(() => {
    let z = Map({
        val: true,
        meta: Map({type: isBool})
    });

    foo(x, z);
}, "default called when no matching impl");


// impl foo for (int, real)
// ========================
foo.implementFor(List([isInt, isReal]), (x, y) => {
    return Map({
        val: x.get('val') + y.get('val'),
        meta: Map({ type: isReal, impl: 'int, real' })
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
    foo(x, y)
));


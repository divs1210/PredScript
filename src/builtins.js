const immutable = require('immutable');
const { Map: _Map, is: _is, List: _List } = immutable;
const BigNumber = require('decimal.js');
const { MultiMethod, derive: _derive, isA: _isA, } = require('./multi');
const { loop, recur } = require('./loop');
const { val, isNull: isJSNull } = require('./util');

// TODO: ffi: fromJS and toJS

// reify JS
// ========
const _String = globalThis.String;


// objects and types
// =================
const Obj = (val, type) => {
    let m = _Map({ val });
    m.__psType__ = type;
    return m;
}


// types util
// ==========
function getType(obj) {
    return obj.__psType__;
}

function setType(obj, type) {
    obj.__psType__ = type;
}

function _check(type, obj) {
    let t = getType(obj);
    if (_isA(type, t))
        return obj;
    throw new Error(`Type Error: Expected ${val(type).mName}, but got ${val(t).mName}!`);
}


// Predicates
// ==========
const _isPred = new MultiMethod('isPred', getType);
const isPred = Obj(_isPred);
setType(isPred, isPred);


// isAny
// =====
const _isAny  = new MultiMethod('isAny', getType);
const isAny = Obj(_isAny, isPred);


// Booleans
// ========
const _isBool = new MultiMethod('isBool', getType);
const isBool = Obj(_isBool, isPred);
_derive(isAny, isBool);

const TRUE  = Obj(true,  isBool);
const FALSE = Obj(false, isBool);

_isBool.implementFor(
    _List([isAny]),
    isBool,
    _ => FALSE
);
_isBool.implementFor(
    _List([isBool]),
    isBool,
    _ => TRUE
); 

function Bool(b) {
    return b === true? TRUE : FALSE;
}


// can implement isAny now
// =======================
_isAny.implementFor(
    _List([isAny]),
    isBool,
    _ => TRUE
);


// Predicates continued
// ====================
_isPred.implementFor(
    _List([isAny]),
    isBool,
    _ => FALSE
);
_isPred.implementFor(
    _List([isPred]),
    isBool,
    _ => TRUE
);


// Null
// ====
const _isNull = new MultiMethod('isNull', getType);
const isNull = Obj(_isNull, isPred);
_derive(isAny, isNull);

const NULL  = Obj(null, isNull);

_isNull.implementFor(
    _List([isNull]),
    isBool,
    _ => TRUE
);
_isNull.implementFor(
    _List([isAny]),
    isBool,
    _ => FALSE
);


// List
// ====
const _isList = new MultiMethod("isList", getType);
const isList = Obj(_isList, isPred);
_derive(isAny, isList);

_isList.implementFor(
    _List([isAny]),
    isBool,
    _ => FALSE
);
_isList.implementFor(
    _List([isList]),
    isBool, 
    _ => TRUE
);

function List(...jsArray) {
    return Obj(
        _List(jsArray),
        isList
    );
}


// Casting
// =======
const ___AS__ = new MultiMethod("__AS__", getType);
___AS__.implementFor(
    _List([isPred, isAny]),
    isAny,
    (type, obj) => {
        setType(obj, type);
        return NULL;
    }
);

const _AS = new MultiMethod("AS", getType);
_AS.implementFor(
    _List([isPred, isAny]),
    isAny,
    (type, obj) => {
        let newObj = Object.create(obj);
        newObj.__psType__ = type;
        return newObj;
    }
);

const _as = new MultiMethod("as", getType);
_as.implementFor(
    _List([isPred, isAny]),
    isAny,
    (pred, obj) => {
        let t = getType(obj);
        if(_isA(pred, t))
            return obj;
        else if (val(pred)(obj) === TRUE)
            return val(AS)(pred, obj);
        throw new Error(`Cannot cast ${val(t).mName} to ${val(pred).mName}!`)
    }
);


// MultiFns
// ========
const _isFn = new MultiMethod("isFn", getType);
const isFn = Obj(_isFn, isPred);
_derive(isAny, isFn);
_derive(isFn, isPred);

_isFn.implementFor(
    _List([isAny]),
    isBool,
    _ => FALSE
);
_isFn.implementFor(
    _List([isFn]),
    isBool,
    _ => TRUE
);
_isFn.implementFor(
    _List([isPred]),
    isBool,
    _ => TRUE
);

function _MultiFn(name) {
    return Obj(
        new MultiMethod(name, getType),
        isFn
    );
}

function Implement(multi, argTypes, retType, f) {
    let jsMulti = val(multi);
    let jsArgTypes = val(argTypes);

    let checkedF = (...args) => {
        let res = f(...args);
        return _check(retType, res);
    };

    jsMulti.implementFor(jsArgTypes, retType, checkedF);

    return NULL;
}


// derive
// ======
const derive = _MultiFn('derive');
const Derive = val(derive);

Implement(
    derive,
    List(isPred, isPred),
    isNull,
    (isParent, isChild) => {
        _derive(isParent, isChild);
        Implement(
            isChild,
            List(isAny),
            isBool, 
            _ => FALSE
        );
        Implement(
            isChild,
            List(isChild),
            isBool, 
            _ => TRUE
        );
        Implement(
            isParent,
            List(isChild),
            isBool, 
            _ => TRUE
        );
        Implement(
            isChild,
            List(isParent),
            isBool, 
            _ => TRUE
        );
        return NULL;
    }
);


// MultiFn cntd
// ============
function MultiFn(name, parent) {
    let obj = _MultiFn(name);

    if(parent) {
        setType(obj, isPred);
        Derive(parent, obj);
    }        
    
    return obj;
}


// type
// ====
const type = MultiFn('type');
const _type = val(type);

Implement(
    type,
    List(isAny),
    isPred,
    getType
);


// Bool contd
// ==========
const neg = MultiFn("neg");

Implement(
    neg,
    List(isBool),
    isBool,
    b => Bool(!val(b))
);


// Real Numbers
// ============
const isReal = MultiFn("isReal", isAny);

function Real(n) {
    return Obj(
        new BigNumber(n), 
        isReal
    );
}

const BigNumberZERO = new BigNumber(0);
Implement(
    neg,
    List(isReal),
    isReal,
    r => Real(BigNumberZERO.minus(val(r)))
);


// Integers
// ========
const isInt = MultiFn("isInt", isReal);

Implement(
    isInt,
    List(isReal),
    isBool, 
    r => val(r).floor().eq(val(r)) ? TRUE : FALSE
);

function Int(n) {
    return Obj(
        (new BigNumber(n)).floor(),
        isInt
    );
}

Implement(
    neg,
    List(isInt),
    isInt,
    r => Int(BigNumberZERO.minus(val(r)))
);


// Arithmetic
// ===========
const add = MultiFn('add');
Implement(
    add,
    List(isInt, isInt),
    isInt,
    (x, y) => Int(x.get('val').plus(y.get('val')))
);
Implement(
    add,
    List(isReal, isReal),
    isReal,
    (x, y) => Real(x.get('val').plus(y.get('val')))
);

const minus = MultiFn('sub');
Implement(
    minus,
    List(isInt, isInt),
    isInt,
    (x, y) => Int(x.get('val').minus(y.get('val')))
);
Implement(
    minus,
    List(isReal, isReal),
    isReal,
    (x, y) => Real(x.get('val').minus(y.get('val')))
);

const times = MultiFn('times');
Implement(
    times,
    List(isInt, isInt),
    isInt,
    (x, y) => Int(x.get('val').times(y.get('val')))
);
Implement(
    times,
    List(isReal, isReal),
    isReal,
    (x, y) => Real(x.get('val').times(y.get('val')))
);

const divide = MultiFn('divide');
Implement(
    divide,
    List(isInt, isInt),
    isInt,
    (x, y) => Int(x.get('val').div(y.get('val')))
);
Implement(
    divide,
    List(isReal, isReal),
    isReal,
    (x, y) => Real(x.get('val').div(y.get('val')))
);

const mod = MultiFn('mod');
Implement(
    mod,
    List(isInt, isInt),
    isInt,
    (x, y) => Int(x.get('val').mod(y.get('val')))
);

const pow = MultiFn('pow');
Implement(
    pow,
    List(isInt, isInt),
    isInt,
    (x, y) => Int(x.get('val').pow(y.get('val')))
);
Implement(
    pow,
    List(isReal, isReal),
    isReal,
    (x, y) => Real(x.get('val').pow(y.get('val')))
);

const abs = MultiFn('abs');
Implement(
    abs,
    List(isInt),
    isInt,
    (x) => Int(val(x).abs().floor())
);
Implement(
    abs,
    List(isReal),
    isReal,
    (x) => Real(val(x).abs())
);


// Logic operators
// ===============
const is = MultiFn('is');
Implement(
    is,
    List(isAny, isAny),
    isBool,
    (x, y) => Bool(_is(x, y))
);
Implement(
    is,
    List(isReal, isReal),
    isBool,
    (x, y) => Bool(x.get('val').eq(y.get('val')))
);

const isNot = MultiFn('isNot');
Implement(
    isNot,
    List(isAny, isAny),
    isBool,
    (x, y) => _apply(neg, List(_apply(is, List(x, y))))
);

const isLessThan = MultiFn('isLessThan');
Implement(
    isLessThan,
    List(isReal, isReal),
    isBool,
    (x, y) => Bool(x.get('val').lt(y.get('val')))
);

const isLessThanEq = MultiFn('isLessThanEq');
Implement(
    isLessThanEq,
    List(isReal, isReal),
    isBool,
    (x, y) => Bool(x.get('val').lte(y.get('val')))
);

const isGreaterThan = MultiFn('isGreaterThan');
Implement(
    isGreaterThan,
    List(isReal, isReal),
    isBool,
    (x, y) => Bool(x.get('val').gt(y.get('val')))
);

const isGreaterThanEq = MultiFn('isGreaterThanEq');
Implement(
    isGreaterThanEq,
    List(isReal, isReal),
    isBool,
    (x, y) => Bool(x.get('val').gte(y.get('val')))
);


// Chars
// =====
const isChar = MultiFn("isChar", isInt);

function CharFromCodePoint(jsCodePoint) {
    return Obj(
        (new BigNumber(jsCodePoint)).floor(),
        isChar
    );
}

function Char(s) {
    return CharFromCodePoint(s.codePointAt(0));
}


// toInt
// =====
const toInt = MultiFn('int');
Implement(
    toInt,
    List(isBool),
    isInt,
    b => b === TRUE? Int(1): Int(0)
);
Implement(
    toInt,
    List(isChar),
    isInt,
    ch => _AS(isInt, ch)
);
Implement(
    toInt,
    List(isReal),
    isInt,
    r => {
        let n = val(r).round(BigNumber.ROUND_HALF_CEIL);
        return Obj(n, isInt);
    }
);


// Map
// ===
const isMap = MultiFn("isMap", isAny);

function Map(...jsArray) {
    return Obj(
        _Map.of(...jsArray),
        isMap
    );
}


// Strings
// =======
const isString = MultiFn("isString", isAny);

const String = (s) => Obj(s, isString);

// toString
const toString = MultiFn('toString');
Implement(
    toString,
    List(isAny),
    isString,
    i => String('' + val(i))
);
Implement(
    toString,
    List(isInt),
    isString,
    i => String(val(i).toFixed(0))
);
Implement(
    toString,
    List(isChar),
    isString,
    ch => String(_String.fromCodePoint(val(ch).toNumber()))
);
Implement(
    toString,
    List(isFn),
    isString,
    f => String(val(f).mName)
);
Implement(
    toString,
    List(isPred),
    isString,
    p => String(val(p).mName)
);
Implement(
    toString,
    List(isList),
    isString,
    l => String(
        '['
        + val(l).map(x => val(val(toString)(x))).join(', ')
        + ']'
    )
);
Implement(
    toString,
    List(isMap),
    isString,
    m => String(
        '{'
        + val(m).entrySeq().map(([k, v]) =>
            val(val(toString)(k))
            + ": "
            + val(val(toString)(v))
        ).join(', ')
        + '}'
    )
);

// strcat
Implement(
    add,
    List(isString, isString),
    isString,
    (x, y) => String(val(x) + val(y))
);
Implement(
    add,
    List(isString, isAny),
    isString,
    (x, y) => String(val(x) + val(toString)(y).get('val'))
);
Implement(
    add,
    List(isAny, isString),
    isString,
    (x, y) => String(val(toString)(x).get('val') + val(y))
);


// toList
// ======
const toList = MultiFn("toList");
Implement(
    toList,
    List(isString),
    isList,
    s => {
        let jsString = val(s);
        let jsChars = [...jsString];
        return List(...jsChars.map(Char));
    }
);
Implement(
    toList,
    List(isMap),
    isList,
    m => {
        let jsMap = val(m);
        let jsList = _List(jsMap);
        let ret = Obj(
            jsList.map(kv => List(...kv)),
            isList
        );

        return ret;
    }
);


// Collections
// ===========
const isEmpty = MultiFn('isEmpty');
Implement(
    isEmpty,
    List(isList),
    isBool,
    (l) => val(l).isEmpty() ? TRUE : FALSE
);
Implement(
    isEmpty,
    List(isString),
    isBool,
    (l) => val(l).length === 0 ? TRUE : FALSE
);
Implement(
    isEmpty,
    List(isMap),
    isBool,
    (m) => val(m).size === 0 ? TRUE : FALSE
);


const size = MultiFn('size');
Implement(
    size,
    List(isList),
    isInt,
    (l) => Int(val(l).size)
);
Implement(
    size,
    List(isString),
    isInt,
    // correctly handles unicode
    (s) => Int([...val(s)].length)
);
Implement(
    size,
    List(isMap),
    isInt,
    (m) => Int(val(m).size)
);


const get = MultiFn('get');
Implement(
    get,
    List(isList, isInt),
    isAny,
    (l, idx) => {
        let res = val(l).get(val(idx).toNumber());
        return isJSNull(res) ? NULL : res;
    }
);
Implement(
    get,
    List(isString, isInt),
    isChar,
    // correctly handles unicode
    (s, idx) => {
        let jsCodePoint = val(s).codePointAt(val(idx).toNumber());
        return isJSNull(jsCodePoint) ? NULL : CharFromCodePoint(jsCodePoint);
    }
);
Implement(
    get,
    List(isMap, isAny),
    isAny,
    (m, k) => {
        let res = val(m).get(k);
        return isJSNull(res) ? NULL : res;
    }
);


const set = MultiFn('set');
Implement(
    set,
    List(isList, isInt, isAny),
    isList,
    (l, idx, newVal) => Obj(val(l).set(val(idx).toNumber(), newVal), isList)
);
Implement(
    set,
    List(isString, isInt, isChar),
    isString,
    (s, idx, ch) => {
        let jsString = val(s);
        let unicodeChars = [...jsString];
        let jsIdx = val(idx).toNumber();
        let jsChar = val(val(toString)(ch));
        unicodeChars[jsIdx] = jsChar;
        let psString = unicodeChars.join('');
        return String(psString);
    }
);
Implement(
    set,
    List(isMap, isAny, isAny),
    isMap,
    (m, k, v) => Obj(val(m).set(k, v), isMap)
);


const slice = MultiFn('slice');
Implement(
    slice,
    List(isList, isInt),
    isList,
    (l, start) => Obj(val(l).slice(val(start).toNumber()), isList)
);
Implement(
    slice,
    List(isList, isInt, isInt),
    isList,
    (l, start, end) => Obj(val(l).slice(val(start).toNumber(), val(end).toNumber()), isList)
);


const unshift = MultiFn('unshift');
Implement(
    unshift,
    List(isList, isAny),
    isList,
    (l, x) => Obj(val(l).unshift(x), isList)
);


const push = MultiFn('push');
Implement(
    push,
    List(isList, isAny),
    isList,
    (l, x) => Obj(val(l).push(x), isList)
);


// Refs
// ====
const isRef = MultiFn("isRef", isAny);

function _Ref(x) {
    let obj = { val: x };
    return Obj(obj, isRef);
}
_Ref.mName = 'Ref';

const Ref = Obj(_Ref, isFn);

Implement(
    set,
    List(isRef, isAny),
    isAny,
    (ref, newVal) => {
        val(ref).val = newVal;
        return ref;
    }
);


// Apply
// =====
function _apply(f, args) {
    let jsF = val(f);
    let jsArgs = val(args);
    return jsF(...jsArgs);
}

const apply = MultiFn('apply');
Implement(
    apply,
    List(isFn, isList),
    isAny,
    _apply
);
Implement(
    apply,
    List(isRef, isList),
    isAny,
    (r, _) => val(r).val
);


// IO
// ==
const println = MultiFn("println");
Implement(
    println,
    List(),
    isNull,
    (x) => {
        console.log();
        return NULL;
    }
);
Implement(
    println,
    List(isAny),
    isNull,
    (x) => {
        let jsString = val(toString)(x).get('val');
        console.log(jsString);
        return NULL;
    }
);


// more fns
// ========
const __AS__ = Obj(___AS__, isFn);
const   AS   = Obj(  _AS,   isFn);
const   as   = Obj(  _as,   isFn);


// hierarchy related
// =================
const isA = MultiFn("isA");
Implement(
    isA,
    List(isPred, isPred),
    isBool,
    (ancestor, descendent) => Bool(_isA(ancestor, descendent))
);


const isImplementedFor = MultiFn('isImplementedFor');
Implement(
    isImplementedFor,
    List(isFn, isList, isPred),
    isBool,
    (f, argTypes, retType) => {
        let jsF = val(f);
        let jsArgTypes = val(argTypes);
        
        // in case of lambda
        if (!jsF.implementationFor)
            return FALSE;

        // in case of MultiFn
        let impl = jsF.implementationFor(jsArgTypes, true);

        // no matching implementation
        if(!impl)
            return FALSE;

        return _isA(retType, impl.retType)? TRUE : FALSE;        
    }
);


// misc
// ====
function _memoize(f) {
    let cache = _Map();
    return function (...argsArray) {
        let argsList = _List(argsArray);
        if(!cache.has(argsList)) {
            let res = f(...argsArray);
            cache = cache.set(argsList, res);
            return res;
        } else
            return cache.get(argsList);
    }
}


function _Lambda(f) {
    f.mName = 'lambda';
    return Obj(f, isFn);
}


// assertions
const assert = _Lambda((check, msg) => {
    if (!_is(check, TRUE))
        throw new Error(`Assertion failed! Message: ${msg?.get('val') || 'null'}`);

    return NULL;
});

const assertError = _Lambda((checkFn, msg) => {
    let threw = false;

    try {
        val(checkFn)();
    } catch(e) {
        threw = true;
    }

    if (!threw)
        throw new Error(`Assertion failed! Message: ${msg?.get('val') || 'null'}`);

    return NULL;
});


module.exports = {
    MultiFn,
    isFn,
    Implement,
    isImplementedFor,
    derive,
    Obj,
    val,
    isAny,
    isNull,
    NULL,
    isBool,
    Bool,
    TRUE,
    FALSE,
    neg,
    isPred,
    isReal,
    Real,
    isInt,
    Int,
    toInt,
    isChar,
    Char,
    isList,
    List,
    _List,
    toList,
    isMap,
    Map,
    size,
    get,
    set,
    isEmpty,
    slice,
    unshift,
    push,
    apply,
    _apply,
    add,
    minus,
    times,
    divide,
    mod,
    pow,
    abs,
    is,
    isNot,
    _is,
    isLessThan,
    isLessThanEq,
    isGreaterThan,
    isGreaterThanEq,
    String,
    isString,
    toString,
    isRef,
    Ref,
    println,
    type,
    _type,
    _check,
    _memoize,
    __AS__,
    AS,
    as,
    isA,
    _Lambda,
    assert,
    assertError,
    loop,
    recur
};
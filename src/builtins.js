const immutable = require('immutable');
const { Map: _Map, is: _is, List: _List } = immutable;
const BigNumber = require('bignumber.js');
const { MultiMethod, derive: _derive, isA, ancestorsOf } = require('./multi');
const { val } = require('./util');

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


// TODO: the following 2
// should happen automatically
// for predicates
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
// TODO: the following 2
// should happen automatically
// for predicates
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

// TODO: the following 2
// should happen automatically
// for predicates
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

// TODO: the following 2
// should happen automatically
// for predicates
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
        if(isA(pred, t))
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

// TODO: the following 2
// should happen automatically
// for predicates
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

function MultiFn(name) {
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
        return _as(retType, res);
    };

    jsMulti.implementFor(jsArgTypes, retType, checkedF);

    if(jsArgTypes.size === 1 && retType === isBool) {
        setType(multi, isPred);

        if(ancestorsOf(multi).isEmpty())
            _derive(isAny, multi);
    }

    return NULL;
}


// derive
// ======
const derive = MultiFn('derive');
const Derive = val(derive);

Implement(
    derive,
    List(isPred, isPred),
    isNull,
    (parent, child) => {
        _derive(parent, child);
        Implement(
            parent,
            List(child),
            isBool,
            _ => TRUE
        );
        return NULL;
    }
);


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
const isReal = MultiFn("isReal");
setType(isReal, isPred);
_derive(isAny, isReal);

// TODO: the following 2
// should happen automatically
// for predicates
Implement(
    isReal,
    List(isAny),
    isBool, 
    _ => FALSE
);
Implement(
    isReal,
    List(isReal),
    isBool, 
    _ => TRUE
);

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
const isInt = MultiFn("isInt");
setType(isInt, isPred);
Derive(isReal, isInt);

// TODO: the following 2
// should happen automatically
// for predicates
Implement(
    isInt,
    List(isAny),
    isBool, 
    _ => FALSE
);
Implement(
    isInt,
    List(isInt),
    isBool, 
    _ => TRUE
);

Implement(
    isInt,
    List(isReal),
    isBool, 
    r => val(r).integerValue().eq(val(r)) ? TRUE : FALSE
);

function Int(n) {
    return Obj(
        (new BigNumber(n)).integerValue(),
        isInt
    );
}


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
Implement(
    mod,
    List(isReal, isReal),
    isReal,
    (x, y) => Real(x.get('val').mod(y.get('val')))
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
// TODO: implement is for other types:
// List, Map


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
const isChar = MultiFn("isChar");
setType(isChar, isPred);
_derive(isInt, isChar);

function CharFromCodePoint(jsCodePoint) {
    return Obj(
        (new BigNumber(jsCodePoint)).integerValue(),
        isChar
    );
}

function Char(s) {
    return CharFromCodePoint(s.codePointAt(0));
}


// toInt
// =====
const int = MultiFn('int');
Implement(
    int,
    List(isBool),
    isInt,
    b => b === TRUE? Int(1): Int(0)
);
Implement(
    int,
    List(isChar),
    isInt,
    ch => _AS(isInt, ch)
);
Implement(
    int,
    List(isReal),
    isInt,
    r => {
        let n = val(r).integerValue(BigNumber.ROUND_HALF_CEIL);
        return Obj(n, isInt);
    }
);


// Map
// ===
const isMap = MultiFn("isMap");
setType(isMap, isPred);
_derive(isAny, isMap);

Implement(
    isMap,
    List(isAny), 
    isBool,
    _ => FALSE
);
Implement(
    isMap,
    List(isMap), 
    isBool,
    _ => TRUE
);

function Map(...jsArray) {
    return Obj(
        _Map.of(...jsArray),
        isMap
    );
}


// Strings
// =======
const isString = MultiFn("isString");
setType(isString, isPred);
_derive(isAny, isString);

// TODO: the following 2
// should happen automatically
// for predicates
Implement(
    isString,
    List(isAny), 
    isBool,
    _ => FALSE
);
Implement(
    isString,
    List(isString), 
    isBool,
    _ => TRUE
);

const String = (s) => Obj(s, isString);

// toString
const str = MultiFn('str');
Implement(
    str,
    List(isAny),
    isString,
    i => String('' + val(i))
);
Implement(
    str,
    List(isInt),
    isString,
    i => String(val(i).toFixed(0))
);
Implement(
    str,
    List(isChar),
    isString,
    ch => String(_String.fromCodePoint(val(ch).toNumber()))
);
Implement(
    str,
    List(isFn),
    isString,
    f => String(val(f).mName)
);
Implement(
    str,
    List(isPred),
    isString,
    p => String(val(p).mName)
);
Implement(
    str,
    List(isList),
    isString,
    l => String(
        '['
        + val(l).map(x => val(val(str)(x))).join(', ')
        + ']'
    )
);
Implement(
    str,
    List(isMap),
    isString,
    m => String(
        '{'
        + val(m).entrySeq().map(([k, v]) =>
            val(val(str)(k))
            + ": "
            + val(val(str)(v))
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
    (x, y) => String(val(x) + val(str)(y).get('val'))
);
Implement(
    add,
    List(isAny, isString),
    isString,
    (x, y) => String(val(str)(x).get('val') + val(y))
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
    (l, idx) => val(l).get(val(idx).toNumber())
);
Implement(
    get,
    List(isString, isInt),
    isChar,
    // correctly handles unicode
    (s, idx) => {
        let jsCodePoint = val(s).codePointAt(val(idx).toNumber());
        return CharFromCodePoint(jsCodePoint);
    }
);
Implement(
    get,
    List(isMap, isAny),
    isAny,
    (m, k) => val(m).get(k)
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
        let jsChar = val(val(str)(ch));
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
        let jsString = val(str)(x).get('val');
        console.log(jsString);
        return NULL;
    }
);


// more fns
// ========
const __AS__ = Obj(___AS__, isFn);
const   AS   = Obj(  _AS,   isFn);
const   as   = Obj(  _as,   isFn);


module.exports = {
    MultiFn,
    isFn,
    Implement,
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
    int,
    isChar,
    Char,
    isList,
    List,
    _List,
    isMap,
    Map,
    size,
    get,
    set,
    isEmpty,
    apply,
    _apply,
    add,
    minus,
    times,
    divide,
    mod,
    pow,
    is,
    _is,
    isLessThan,
    isLessThanEq,
    isGreaterThan,
    isGreaterThanEq,
    String,
    isString,
    str,
    println,
    type,
    _type,
    __AS__,
    AS,
    as,
    derive
};
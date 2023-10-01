const { Map, is: _is, List: _List } = require('immutable');
const BigNumber = require('bignumber.js');
const { MultiMethod, derive: _derive, isA, ancestorsOf } = require('./multi');
const { val } = require('./util');

// objects and types
// =================
const Obj = (val, type) =>
      Map({
          val:  val,
          meta: { // mutable meta
            type: type
          }
      });


// types util
// ==========
function getType(obj) {
    return obj.get('meta').type;
}

function setType(obj, type) {
    if (getType(obj) !== type)
        obj.get('meta').type = type;
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
        let meta = obj.get('meta');
        let newMeta = {};

        for(key in meta)
            newMeta[key] = meta[key];

        newMeta.type = type;
        return obj.set('meta', newMeta);
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
// ================
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

function String(s) {
    return Obj(s, isString);
}

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
    isAny,
    (s, idx) => String(val(s)[val(idx).toNumber()])
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
    isList,
    List,
    _List,
    get,
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
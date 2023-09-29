const { Map, is: _is, List: _List, Set } = require('immutable');
const BigNumber = require('bignumber.js');
const { MultiMethod, derive: _derive, isA } = require('./multi');
const { val } = require('./util');

// objects and types
// =================
const Obj = (val, type) =>
      Map({
          val:  val,
          // mutable meta
          meta: {
            type: type || null
          }
      });


// primitives
// ==========
const NULL  = Obj(null);
const TRUE  = Obj(true);
const FALSE = Obj(false);

const _isAny = _ => TRUE;
const isAny = Obj(_isAny);

function _type(obj) {
    return obj.get('meta').type
}

function setType(obj, type) {
    obj.get('meta').type = type;
}


// Predicates
// ==========
const _isPred = new MultiMethod('isPred', _type);
const isPred = Obj(_isPred);
setType(isPred, isPred);


// Any
// ===
setType(isAny, isPred);


// Booleans
// ========
const _isBool = (obj) => (obj === TRUE || obj === FALSE) ? TRUE : FALSE;
const isBool = Obj(_isBool, isPred);
setType(TRUE, isBool);
setType(FALSE, isBool);
_derive(isAny, isBool);
_isBool.mName = 'isBool';
_isBool.implementationFor = () => {
    return {
        argTypes: _List([isAny]),
        retType: isBool,
        f: _isBool
    };
};

function Bool(b) {
    return b === true? TRUE : FALSE;
}


// can fully define isAny now
// ==========================
_isAny.mName = 'isAny';
_isAny.implementationFor = () => {
    return {
        argTypes: _List([isAny]),
        retType: isBool,
        f: _isAny
    };
}

// this has to be done for
// all builtin fns
// that are not multimethods
_type.mName = "type";
_type.implementationFor = () => {
    return {
        argTypes: _List([isAny]),
        retType: isPred,
        f: _type
    };
}


// Predicates continued
// ====================
// TODO: the following 2
// should happen automatically
// for predicates
_isPred.implementFor(
    _List([isAny]),
    isBool,
    _ => False
);
_isPred.implementFor(
    _List([isPred]),
    isBool,
    _ => TRUE
);


// List
// ====
const _isList = new MultiMethod("isList", _type);
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

function List(jsArray) {
    return Obj(
        _List(jsArray),
        isList
    );
}


// Casting
// =======
const ___AS__ = (type, obj) => {
    setType(obj, type);
    return NULL;
}
___AS__.mName = '__AS__';
___AS__.implementationFor = () => {
    return {
        argTypes: _List([isPred, isAny]),
        retType: isNull,
        f: ___AS__
    };
};


const _AS = (type, obj) => {
    let meta = obj.get('meta');
    let newMeta = {};
    for(key in meta)
        newMeta[key] = meta[key];
    newMeta.type = type;
    return obj.set('meta', newMeta);
};
_AS.mName = 'AS';
_AS.implementationFor = () => {
    return {
        argTypes: _List([isPred, isAny]),
        retType: isAny,
        f: _AS
    };
};


const _as = (pred, obj) => {
    let t = _type(obj);
    if(isA(pred, t))
        return obj;
    else if (val(pred)(obj) === TRUE)
        return val(AS)(pred, obj);
    throw new Error(`Cannot cast ${val(t).mName} to ${val(pred).mName}!`);
};
_as.mName = 'as';
_as.implementationFor = () => {
    return {
        argTypes: _List([isPred, isAny]),
        retType: isAny,
        f: _as
    };
};


// MultiFns
// ========
const _isMultiFn = new MultiMethod("isMultiFn", _type);
const isMultiFn = Obj(_isMultiFn, isPred);

_isMultiFn.implementFor(
    _List([isAny]),
    isBool,
    _ => FALSE
);
_isMultiFn.implementFor(
    _List([isMultiFn]),
    isBool,
    _ => TRUE
);

function MultiFn(name) {
    return Obj(
        new MultiMethod(name, _type),
        isMultiFn
    );
}

function Implement(multi, argTypes, retType, f) {
    let jsMulti = val(multi);
    let jsArgTypes = val(argTypes);
    jsMulti.implementFor(jsArgTypes, retType, f);
    return NULL;
}

function Derive(parent, child) {
    _derive(parent, child);
    Implement(
        parent,
        _List([child]),
        isBool,
        _ => TRUE
    );
    return NULL;
};
Derive.mName = 'derive';
Derive.implementationFor = () => {
    return {
        argTypes: _List([isPred, isPred]),
        retType: isNull,
        f: Derive
    };
};


// Null
// ====
const _isNull = (obj) => obj === NULL ? TRUE : FALSE;
const isNull = Obj(_isNull, isPred);
setType(NULL, isNull);
_derive(isAny, isNull);
_isNull.mName = 'isNull';
_isNull.implementationFor = () => {
    return {
        argTypes: _List([isAny]),
        retType: isBool,
        f: _isNull
    };
};


// Bool contd
// ==========
const neg = MultiFn("neg");

Implement(
    neg,
    List([isBool]),
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
    List([isAny]),
    isBool, 
    _ => FALSE
);
Implement(
    isReal,
    List([isReal]),
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
    List([isReal]),
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
    List([isAny]),
    isBool, 
    _ => FALSE
);
Implement(
    isInt,
    List([isInt]),
    isBool, 
    _ => TRUE
);

Implement(
    isInt,
    List([isReal]),
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
    List([isInt, isInt]),
    isInt,
    (x, y) => Int(x.get('val').plus(y.get('val')))
);
Implement(
    add,
    List([isReal, isReal]),
    isReal,
    (x, y) => Real(x.get('val').plus(y.get('val')))
);

const minus = MultiFn('sub');
Implement(
    minus,
    List([isInt, isInt]),
    isInt,
    (x, y) => Int(x.get('val').minus(y.get('val')))
);
Implement(
    minus,
    List([isReal, isReal]),
    isReal,
    (x, y) => Real(x.get('val').minus(y.get('val')))
);

const times = MultiFn('times');
Implement(
    times,
    List([isInt, isInt]),
    isInt,
    (x, y) => Int(x.get('val').times(y.get('val')))
);
Implement(
    times,
    List([isReal, isReal]),
    isReal,
    (x, y) => Real(x.get('val').times(y.get('val')))
);

const divide = MultiFn('divide');
Implement(
    divide,
    List([isInt, isInt]),
    isInt,
    (x, y) => Int(x.get('val').div(y.get('val')))
);
Implement(
    divide,
    List([isReal, isReal]),
    isReal,
    (x, y) => Real(x.get('val').div(y.get('val')))
);

const mod = MultiFn('mod');
Implement(
    mod,
    List([isInt, isInt]),
    isInt,
    (x, y) => Int(x.get('val').mod(y.get('val')))
);
Implement(
    mod,
    List([isReal, isReal]),
    isReal,
    (x, y) => Real(x.get('val').mod(y.get('val')))
);

const pow = MultiFn('pow');
Implement(
    pow,
    List([isInt, isInt]),
    isInt,
    (x, y) => Int(x.get('val').pow(y.get('val')))
);
Implement(
    pow,
    List([isReal, isReal]),
    isReal,
    (x, y) => Real(x.get('val').pow(y.get('val')))
);


// Logic operators
// ================
const is = MultiFn('is');
Implement(
    is,
    List([isAny, isAny]),
    isBool,
    (x, y) => Bool(_is(x, y))
);
Implement(
    is,
    List([isReal, isReal]),
    isBool,
    (x, y) => Bool(x.get('val').eq(y.get('val')))
);

const isLessThan = MultiFn('isLessThan');
Implement(
    isLessThan,
    List([isReal, isReal]),
    isBool,
    (x, y) => Bool(x.get('val').lt(y.get('val')))
);

const isLessThanEq = MultiFn('isLessThanEq');
Implement(
    isLessThanEq,
    List([isReal, isReal]),
    isBool,
    (x, y) => Bool(x.get('val').lte(y.get('val')))
);

const isGreaterThan = MultiFn('isGreaterThan');
Implement(
    isGreaterThan,
    List([isReal, isReal]),
    isBool,
    (x, y) => Bool(x.get('val').gt(y.get('val')))
);

const isGreaterThanEq = MultiFn('isGreaterThanEq');
Implement(
    isGreaterThanEq,
    List([isReal, isReal]),
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
    List([isAny]), 
    isBool,
    _ => FALSE
);
Implement(
    isString,
    List([isString]), 
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
    List([isAny]),
    isString,
    i => String('' + val(i))
);
Implement(
    str,
    List([isInt]),
    isString,
    i => String(val(i).toFixed(0))
);
Implement(
    str,
    List([isPred]),
    isString,
    p => String(val(p).mName)
);

// concat
Implement(
    add,
    List([isString, isString]),
    isString,
    (x, y) => String(val(x) + val(y))
);
Implement(
    add,
    List([isString, isAny]),
    isString,
    (x, y) => String(val(x) + val(str)(y).get('val'))
);
Implement(
    add,
    List([isAny, isString]),
    isString,
    (x, y) => String(val(str)(x).get('val') + val(y))
);


// Fns
// ===
const isFn = MultiFn('isFn');
setType(isFn, isPred);
_derive(isAny, isFn);
Derive(isFn, isMultiFn);
Derive(isFn, isPred);

// TODO: the following 2
// should happen automatically
// for predicates
Implement(
    isFn,
    List([isAny]), 
    isBool,
    _ => FALSE
);
Implement(
    isFn,
    List([isFn]),
    isBool,
    _ => TRUE
);

Implement(
    str,
    List([isFn]),
    isString,
    f => String(val(f).mName)
);

function Fn(f) {
    return Obj(f, isFn);
}


// Apply
// =====
function _apply(f, args) {
    let jsF = val(f);
    let jsArgs = val(args);
    return jsF(...jsArgs);
}

const apply = MultiFn('apply');
apply.get('val').defaultImpl.f = _apply;
// apply is generic, can't do the following:
// Implement(
//     apply,
//     List([isFn, isList]),
//     isAny,
//     _apply
// );


// IO
// ==
function _println(x)  {
    let jsString = val(str)(x).get('val');
    console.log(jsString);
    return NULL;
}
_println.mName = 'println';
_println.implementationFor = () => {
    return {
        argTypes: _List([isAny]),
        retType: isNull,
        f: _println
    };
};

const println = Fn(_println);


// more fns
// ========
const type = Fn(_type);

const __AS__ = Fn(___AS__);

const derive = Fn(Derive);


// higher order types
// ==================
// union
function _union(predA, predB) {
    let set = Set([predA, predB]);
    let mName = set
        .map(pred => val(pred).mName)
        .join(', ');
    mName = 'union[' + mName + ']';
    
    const f = (obj) => set.has(_type(obj))? TRUE: FALSE;
    f.mName = mName;
    f.implementationFor = () => {
        return {
            argTypes: _List([isAny]),
            retType: isBool,
            f: f
        };
    }

    let newPred = Fn(f);
    setType(newPred, isPred);
    // TODO: should derive from lowest common ancestor
    _derive(isAny, newPred);
    return newPred;
}
_union.mName = 'union';
_union.implementationFor = () => {
    return {
        argTypes: _List([isPred, isPred]),
        retType: isPred,
        f: _union
    };
};
const union = Fn(_union);


// generic AS
const _gen_AS = (pred) => {
    let _f = obj => _AS(pred, obj);
    _f.mName = `AS[${val(pred).mName}]`;
    _f.implementationFor = () => {
        return {
            argTypes: _List([isAny]),
            retType: pred,
            f: _f
        };
    };
    
    return Fn(_f);
}
_gen_AS.mName = "genAS";
_gen_AS.implementationFor = () => {
    return {
        argTypes: _List([isPred]),
        retType: isFn,
        f: _gen_AS
    };
};
const genAS = Fn(_gen_AS);


// generic as
const _gen_as = (pred) => {
    let _f = obj => _as(pred, obj);
    _f.mName = `as[${val(pred).mName}]`;
    _f.implementationFor = () => {
        return {
            argTypes: _List([isAny]),
            retType: pred,
            f: _f
        };
    };
    
    return Fn(_f);
}
_gen_as.mName = "genAs";
_gen_as.implementationFor = () => {
    return {
        argTypes: _List([isPred]),
        retType: isFn,
        f: _gen_as
    };
};
const genAs = Fn(_gen_as);


module.exports = {
    MultiFn,
    isMultiFn,
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
    isFn,
    Fn,
    println,
    type,
    _type,
    __AS__,
    genAS,
    genAs,
    derive,
    union
};
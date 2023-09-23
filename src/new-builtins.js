const { Map, is: _is, List: _List } = require('immutable');
const BigNumber = require('bignumber.js');
const { MultiMethod } = require('./new-multi');

// objects and types
// =================
const Obj = (val, type) =>
      Map({
          val:  val,
          meta: {
            type: type || null
          }
      });

function val(obj) {
    return obj.get('val');
}


// primitives
// ==========
var TRUE  = Obj(true);
var FALSE = Obj(false);
let isAny = Obj(_ => TRUE);

function _type(obj) {
    return obj.get('meta').type || isAny;
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
const _isBool = Obj((obj) => obj === TRUE || obj === FALSE);
const isBool = Obj(_isBool, isPred);
setType(TRUE, isBool);
setType(FALSE, isBool);

function Bool(b) {
    return b === true? TRUE : FALSE;
}


// Predicates continued
// ====================
_isPred.setDefault(isBool, _ => FALSE);
_isPred.implementFor(
    _List([isPred]),
    isBool,
    _ => TRUE
);


// List
// ====
const _isList = new MultiMethod("isList", _type);
const isList = Obj(_isList, isPred);

_isList.setDefault(isBool, _ => FALSE);
_isList.implementFor(
    _List([isList]),
    isBool, 
    _ => true
);

function List(jsArray) {
    return Obj(
        _List(jsArray),
        isList
    );
}


// MultiFns
// ========
const _isMultiFn = new MultiMethod("isMultiFn", _type);
const isMultiFn = Obj(_isMultiFn, isPred);

_isMultiFn.setDefault(isBool, _ => FALSE);
_isMultiFn.implementFor(
    _List([isMultiFn]),
    isBool,
    (_) => TRUE
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
}

function ImplementDefault(multi, retType, f) {
    let jsMulti = val(multi);
    jsMulti.setDefault(retType, f);
}


// Numbers
// =======
const isReal = MultiFn("isReal");
setType(isReal, isPred);

ImplementDefault(isReal, isBool, _ => FALSE);
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


// Apply
// =====
function _apply(f, args) {
    let jsF = val(f);
    let jsArgs = val(args);
    return jsF(...jsArgs);
}

const apply = MultiFn('apply');
ImplementDefault(apply, isAny, _apply);


// Arithmetic
// ==========
const add = MultiFn('add');
Implement(
    add,
    List([isReal, isReal]),
    isReal,
    (x, y) => Real(x.get('val').add(y.get('val')))
);

const sub = MultiFn('sub');
Implement(
    sub,
    List([isReal, isReal]),
    isReal,
    (x, y) => Real(x.get('val').sub(y.get('val')))
);

const times = MultiFn('times');
Implement(
    times,
    List([isReal, isReal]),
    isReal,
    (x, y) => Real(x.get('val').times(y.get('val')))
);

const divide = MultiFn('divide');
Implement(
    divide,
    List([isReal, isReal]),
    isReal,
    (x, y) => Real(x.get('val').div(y.get('val')))
);

const mod = MultiFn('mod');
Implement(
    mod,
    List([isReal, isReal]),
    isReal,
    (x, y) => Real(x.get('val').mod(y.get('val')))
);

const pow = MultiFn('pow');
Implement(
    pow,
    List([isReal, isReal]),
    isReal,
    (x, y) => Real(x.get('val').pow(y.get('val')))
);


// Logic operators
// ================
const is = MultiFn('is');
ImplementDefault(is, isBool, (x, y) => Bool(_is(x, y)));
Implement(
    is,
    List([isReal, isReal]),
    isBool,
    (x, y) => Bool(x.get('val').eq(y.get('val')))
);

const isLessThanEq = MultiFn('isLessThanEq');
Implement(
    isLessThanEq,
    List([isReal, isReal]),
    isBool,
    (x, y) => Bool(x.get('val').lt(y.get('val')))
);

const isGreaterThanEq = MultiFn('isGreaterThanEq');
Implement(
    isGreaterThanEq,
    List([isReal, isReal]),
    isBool,
    (x, y) => Bool(x.get('val').gt(y.get('val')))
);


// Strings
// =======
const isString = MultiFn("isString");
setType(isString, isPred);

ImplementDefault(isString, isBool, _ => FALSE);
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
ImplementDefault(str, isString, (x) => String('' + val(x)));


// Fns
// ===
const isFn = MultiFn('isFn');
setType(isFn, isPred);

ImplementDefault(isFn, isBool, _ => FALSE);
Implement(
    isFn,
    List([isFn]),
    isBool,
    _ => TRUE
);
Implement(
    isFn,
    List([isMultiFn]),
    isBool,
    _ => TRUE
);
Implement(
    isFn,
    List([isPred]),
    isBool,
    _ => TRUE
);

function Fn(f) {
    return Obj(f, isFn);
}


// IO
// ==
function _println(...xs)  {
    let strs = xs.map((x) => val(_apply(str, List([x]))));
    console.log(strs.join(' '));
}

const println = Fn(_println);


// more types
// ==========
const type = Fn(_type);


module.exports = {
    MultiFn,
    Implement,
    ImplementDefault,
    Obj,
    val,
    isAny, 
    isBool,
    Bool,
    TRUE,
    FALSE,
    isPred,
    isReal,
    Real,
    isList,
    List,
    _List,
    apply,
    _apply,
    add,
    sub,
    times,
    divide,
    mod,
    pow,
    is,
    _is,
    isLessThanEq,
    isGreaterThanEq,
    String,
    isString,
    str,
    isFn,
    Fn,
    println,
    type
};
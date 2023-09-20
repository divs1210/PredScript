const {Map, is: _is, getIn, List: _List} = require('immutable');
const BigNumber = require('bignumber.js');
const {MultiMethod} = require('./multi.js');
const { val } = require('./util.js');

// All objects are represented as this
// ===================================
const Obj = (val, meta) =>
      Map({
          val:  val,
          meta: meta || Map()
      });


// Forward declarations
// ====================
let type;


// isPred is the type of types
// ===========================
const _isPred = new MultiMethod("_isPred", (x) => type(x));
const isPred = Obj(_isPred);

_isPred.implement(isPred, (_) => true);
_isPred.setDefault((_) => false);


// `type` is special-cased for isPred
// ==================================
type = (x) => _is(isPred, x)?
    isPred:
    getIn(x, ['meta', 'type'], null);


// Numbers
// =======
const _isReal = new MultiMethod("_isReal", (x) => type(x));
const isReal = Obj(_isReal, Map({type: isPred}));

_isReal.implement(isReal, (_) => true);
_isReal.setDefault((_) => false);

function Real(n) {
    return Obj(
        new BigNumber(n),
        Map({
            type: isReal
        })
    );
}


// List
// ====
const _isList = new MultiMethod("_isList", (x) => type(x));
const isList = Obj(_isList, Map({type: isPred}));

_isList.implement(isList, (_) => true);
_isList.setDefault((_) => false);

function List(jsArray) {
    return Obj(
        _List(jsArray),
        Map({
            type: isList
        })
    );
}


// Polymorphic Top Level Fns
// =========================
const _isFn = new MultiMethod("_isFn", (x) => type(x));
const isFn = Obj(_isFn, Map({type: isPred}));
const dispatch = (...args) =>
    _List(args).map((x) => type(x));

function MultiFn(name) {
    return Obj(
        new MultiMethod(name, dispatch),
        Map({type: isFn})
    );
}

function Implement(multi, argTypes, retType, f) {
    let jsMulti = val(multi);
    let jsArgTypes = val(argTypes);

    let checkedF = (...args) => {
        let res = f(...args);
        let actualRetType = type(res);

        if(_is(retType, actualRetType))
            return res;

        throw new Error(
            `${jsMulti.mName} was expected to return `
            + `${retType}, but actually returned ${actualRetType}.`);
    };
    
    jsMulti.implement(jsArgTypes, checkedF);
}

function ImplementDefault(multi, f) {
    let jsMulti = val(multi);
    jsMulti.setDefault(f);
}


// Apply
// =====
function _apply(f, args) {
    let jsF = val(f);
    let jsArgs = val(args);
    return jsF(...jsArgs);
}

const apply = MultiFn('apply');
ImplementDefault(apply, _apply);


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


// Boolean
// =======
const _isBool = new MultiMethod("_isBool", (x) => type(x));
const isBool = Obj(_isBool, Map({type: isPred}));

_isBool.implement(isBool, (_) => true);
_isBool.setDefault((_) => false);

function _Bool(b) {
    return Obj(b, Map({type: isBool}));
}

const TRUE = _Bool(true);
const FALSE = _Bool(false);
function Bool(b) {
    if (_is(true, b))
        return TRUE;
    else if(_is(false, b))
        return FALSE;
    else
        throw Error(`${b} is not a boolean!`);
}


// Logic operators
// ================
const is = MultiFn('is');
ImplementDefault(is, (x, y) => Bool(_is(x, y)));

const isLessThanEq = MultiFn('isLessThanEq');
Implement(
    isLessThanEq, 
    List([isReal, isReal]),
    isBool,
    (x, y) => Bool(val(x) <= val(y))
);


// exports
// =======
module.exports = {
    type,
    isPred,
    Real,
    isReal,
    MultiFn,
    Implement,
    _apply,
    apply,
    add,
    sub,
    times,
    isBool,
    Bool,
    TRUE,
    FALSE,
    is,
    isLessThanEq,
    isList,
    List
};
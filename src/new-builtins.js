const { isNull, prettify } = require('./util.js');
const { Map, Set, getIn, is: _is, setIn, List: _List } = require('immutable');
const BigNumber = require('bignumber.js');

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

// =============================================================

// type hierarchy
// ==============
let hierarchy = Map({
    parents:     Map(),
    ancestors:   Map(),
    descendents: Map()
});

function parentOf(child) {
    return getIn(hierarchy, ['parents', child], null);
}

function ancestorsOf(child) {
    return getIn(hierarchy, ['ancestors', child], Set());
}

function descendentsOf(ancestor) {
    return getIn(hierarchy, ['descendents', ancestor], Set());
}

function isA(ancestor, descendent) {
    return _is(ancestor, descendent)
        || ancestorsOf(descendent).has(ancestor);
}

function derive(parent, child) {
    // update parent
    if(isNull(parentOf(child))) {
        hierarchy = setIn(hierarchy, ['parents', child], parent);
    } else {
        throw new Error(`Tried to set new parent for ${child}: ${parent}!`);
    }

    // update ancestors
    let newAncestorsOfChild = ancestorsOf(child).add(parent);
    for(let ancestor of ancestorsOf(parent))
        newAncestorsOfChild = newAncestorsOfChild.add(ancestor);

    hierarchy = setIn(hierarchy, ['ancestors', child], newAncestorsOfChild);

    // update descendents
    for(let ancestor of newAncestorsOfChild) {
        hierarchy = setIn(
            hierarchy,
            ['descendents', ancestor],
            descendentsOf(ancestor).add(child)
        );
    }
}

function typeDistance(child, ancestor) {
    if (is(child, ancestor))
        return 0;

    let parent = parentOf(child, ancestor);
    if (isNull(parent))
        return 100;

    return 1 + typeDistance(parent, ancestor);
}

function absTypeDistance(child, ancestor) {
    return Math.min(
        typeDistance(child, ancestor),
        typeDistance(ancestor, child)
    );
}

// =================================================================

// MultiMethods
// ============
function argTypesDistance(fromArgTypes, toArgTypes) {
    return fromArgTypes
    .zip(toArgTypes)
    .map(([x, y]) => absTypeDistance(x, y))
    .reduce((x, y) => x + y, 0);
}

class MultiMethod extends Function {
    constructor(mName) {
        // hack to make objects callable:
        // https://stackoverflow.com/a/40878674/1163490
        super('...args', 'return this.__self__.__call__(...args)');
        var self = this.bind(this);
        this.__self__ = self;

        self.mName = mName;
        self.impls = _List();
        self.defaultImpl = {};
        self.defaultImpl.f = (...args) => {
            throw new Error(`MultiMethod ${mName} not defined for args: ${prettify(args)}`);
        }

        return self;
    }

    setDefault(retType, f) {
        this.defaultImpl = { retType, f };
    }

    implementFor(argTypes, retType, f) {
        this.impls = this.impls.push({argTypes, retType, f});
    }

    matchingImpls(argTypes) {
        let s = argTypes.size;
        return this.impls.filter(impl => {
            for (let i = 0; i < s; i++)
                if (!isA(impl.argTypes.get(i), argTypes.get(i)))
                    return false;
            return true;
        });
    }

    implementationFor(argTypes) {
        let matchingImpls = this.matchingImpls(argTypes);

        if(matchingImpls.isEmpty())
            return this.defaultImpl;

        let sorted = matchingImpls.sortBy(impl => argTypesDistance(argTypes, impl.argTypes));
        let bestFit = sorted.get(0);
        let nextBestFit = sorted.get(1);

        if(isNull(bestFit))
            return this.defaultImpl;
        else if (isNull(nextBestFit))
            return bestFit;
        else if (!is(
                    argTypesDistance(argTypes, bestFit.argTypes),
                    argTypesDistance(argTypes, nextBestFit.argTypes)
                ))
            return bestFit;
        else
            throw new Error(`Ambiguous call to MultiMethod ${this.mName}`
                + `\nargs types: ${prettify(argTypes)}`
                + `\nmethod 1: ${prettify(bestFit.argTypes)}`
                + `\nmethod 2: ${prettify(nextBestFit.argTypes)}`);
    }

    __call__(...args) {
        let impl = this.implementationFor(_List(args).map(_type));
        let retType = impl.retType;
        let res = impl.f(...args);
        let resType = _type(res);

        if (!isA(retType, resType))
            throw new Error(
                `MultiMethod ${this.mName} returned a result of the wrong type!`
                + `\nexpected: ${prettify(retType)}`
                + `\n  actual: ${prettify(resType)}`);

        return res;
    }
}

// =====================================================

// Predicates
// ==========
const _isPred = new MultiMethod('isPred');
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
const _isList = new MultiMethod("isList");
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
const _isMultiFn = new MultiMethod("isMultiFn");
const isMultiFn = Obj(_isMultiFn, isPred);

_isMultiFn.setDefault(isBool, _ => FALSE);
_isMultiFn.implementFor(
    _List([isMultiFn]),
    isBool,
    (_) => TRUE
);

function MultiFn(name) {
    return Obj(
        new MultiMethod(name),
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
    (x, y) => x.eq(y)
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


// // Strings
// // =======
// const _isString = new MultiMethod("_isString", (x) => type(x));
// const isString = Obj(_isString, Map({type: isPred}));

// _isString.implement(isString, (_) => true);
// _isString.setDefault((_) => false);

// function String(s) {
//     return Obj(s, Map({type: isString}));
// }

// // toString
// const str = MultiFn('str');
// ImplementDefault(str, (x) => String('' + val(x)));


// // IO
// // ==
// function _println(...xs)  {
//     let strs = xs.map((x) => val(_apply(str, List([x]))));
//     console.log(strs.join(' '));
// }

// const println = Fn(_println);


// TODO:
// =====
// * switch builtins to use new-multi
// * memoize implementationFor


module.exports = {
    parentOf,
    ancestorsOf,
    descendentsOf,
    derive,
    isA,
    MultiMethod,
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
    isGreaterThanEq
};
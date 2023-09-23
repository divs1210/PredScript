const { isNull, prettify } = require('./util.js');
const { Map, Set, is, getIn, setIn, List: _List } = require('immutable');

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
    return is(ancestor, descendent)
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
let _isPred = new MultiMethod('isPred');
let isPred = Obj(_isPred);
setType(isPred, isPred);

// Any
// ===
setType(isAny, isPred);

// Booleans
// ========
let _isBool = Obj((obj) => obj === TRUE || obj === FALSE);
let isBool = Obj(_isBool, isPred);
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
    (_) => TRUE
);

// Numbers
// =======
const _isReal = new MultiMethod("isReal");
const isReal = Obj(_isReal, isPred);

_isReal.setDefault(isBool, _ => FALSE);
_isReal.implementFor(
    _List([isReal]),
    isBool, 
    (_) => TRUE
);

function Real(n) {
    return Obj(new BigNumber(n), isReal);
}


// List
// ====
const _isList = new MultiMethod("isList");
const isList = Obj(_isList, isPred);

_isList.setDefault(isBool, _ => FALSE);
_isList.implementFor(
    _List([isList]),
    isBool,
    (_) => TRUE
);

function List(jsArray) {
    return Obj(
        _List(jsArray),
        isList
    );
}




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
    List
};
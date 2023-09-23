const { isNull, prettify } = require('./util.js');
const { Map, Set, is, getIn, setIn, List } = require('immutable');

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


// MultiMethods
// ============
function type(obj) {
    return getIn(obj, ['meta', 'type']);
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

// `from` is lower in hierarchy than `to`
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
        self.impls = List();
        self.defaultImpl = {};
        self.defaultImpl.f = (...args) => {
            throw new Error(`MultiMethod ${mName} not defined for args: ${prettify(args)}`);
        }

        return self;
    }

    setDefault(f) {
        this.defaultImpl = { f };
    }

    implementFor(argTypes, f) {
        this.impls = this.impls.push({argTypes, f});
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
            throw new Error(`Ambiguous call to MultiMethod ${this.mName} with args types: ${prettify(argTypes)}`);
    }

    __call__(...args) {
        let impl = this.implementationFor(List(args).map(type));
        return impl.f(...args);
    }
}


// TODO:
// =====
// * multimethods should accept a return type
// * multimethods should check the return type before returning
// * switch builtins to use new-multi
// * memoize implementationFor


module.exports = {
    parentOf,
    ancestorsOf,
    descendentsOf,
    derive,
    isA,
    MultiMethod
};
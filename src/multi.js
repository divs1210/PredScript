const { is, getIn, Set, setIn, Map, List } = require("immutable");
const { isNull } = require("./util");

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


// MultiMethods
// ============
function argTypesDistance(fromArgTypes, toArgTypes) {
    return fromArgTypes
    .zip(toArgTypes)
    .map(([x, y]) => absTypeDistance(x, y))
    .reduce((x, y) => x + y, 0);
}

function argTypesToString(argTypes) {
    let s = argTypes
        .map(t => t.get('val').mName)
        .join(', ')
    return `[${s}]`;
}

class MultiMethod extends Function {
    constructor(mName, getType) {
        // hack to make objects callable:
        // https://stackoverflow.com/a/40878674/1163490
        super('...args', 'return this.__self__.__call__(...args)');
        var self = this.bind(this);
        this.__self__ = self;

        self.mName = mName;
        self.getType = getType;
        self.impls = List();
        self.defaultImpl = {};
        self.defaultImpl.f = (...args) => {
            let implsString = self.impls
                .map(impl => argTypesToString(impl.argTypes))
                .join(', ');

            throw new Error(`MultiMethod '${mName}' not defined for arg types: ` 
                + `${argTypesToString(self.getArgTypes(args))}`)
                + `\nFound implementations for: ${implsString}`;
        }

        return self;
    }

    implementFor(argTypes, retType, f) {
        // remove existing impl if it exists
        let existingImpl = this.impls.find(impl => is(impl.argTypes, argTypes));
        if(existingImpl)
            this.impls = this.impls.filter(impl => impl !== existingImpl);

        this.impls = this.impls.push({argTypes, retType, f});
    }

    matchingImpls(argTypes) {
        let s = argTypes.size;
        return this.impls.filter(impl => {
            if (!is(s, impl.argTypes.size))
                return false;

            for (let i = 0; i < s; i++)
                if (!isA(impl.argTypes.get(i), argTypes.get(i)))
                    return false;

            return true;
        });
    }

    getArgTypes(args) {
        return List(args).map(arg => this.getType(arg));
    }

    // TODO: memoize
    implementationFor(argTypes, dontThrow) {
        let matchingImpls = this.matchingImpls(argTypes);

        if(matchingImpls.isEmpty())
            return null;

        let sorted = matchingImpls.sortBy(impl => argTypesDistance(argTypes, impl.argTypes));
        let bestFit = sorted.get(0);
        let nextBestFit = sorted.get(1);

        if(isNull(bestFit))
            return null;
        else if (isNull(nextBestFit))
            return bestFit;
        else if (!is(
                    argTypesDistance(argTypes, bestFit.argTypes),
                    argTypesDistance(argTypes, nextBestFit.argTypes)
                ))
            return bestFit;
        else {
            if (dontThrow)
                return null;
            else
                throw new Error(`Ambiguous call to MultiMethod ${this.mName}:`
                    + `\nargs types: ${argTypesToString(argTypes)}`
                    + `\n  method 1: ${argTypesToString(bestFit.argTypes)}`
                    + `\n  method 2: ${argTypesToString(nextBestFit.argTypes)}`);
        }
    }

    __call__(...args) {
        let impl = this.implementationFor(this.getArgTypes(args))
                || this.defaultImpl;
        return impl.f(...args);
    }
}

module.exports = {
    parentOf,
    ancestorsOf,
    descendentsOf,
    derive,
    isA,
    MultiMethod
};
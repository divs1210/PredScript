const { isNull, prettify, pprint } = require('./util.js');
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

    implementationFor(argTypes) {
        let matchingImpls = this.impls;
        for (let i = 0; i < argTypes.size; i++) {
            let t = argTypes.get(i);
            matchingImpls = matchingImpls.filter(impl => isA(impl.argTypes.get(i), t));
        }

        let mostSpecificTypes = argTypes;
        let mostSpecificImpl;
        while(mostSpecificTypes.every(t => !isNull(t))) {
            for(let i = 0; i < mostSpecificTypes.size; i++) {
                let t = mostSpecificTypes.get(i);
                mostSpecificImpl = matchingImpls.find(impl => is(t, impl.argTypes.get(i)));

                if(!isNull(mostSpecificImpl))
                    return mostSpecificImpl;
            }

            mostSpecificTypes = mostSpecificTypes.map(parentOf);
        }

        // mostSpecificImpl = mostSpecificImpl || matchingImpls.get(0);

        return !isNull(mostSpecificImpl)?
            mostSpecificImpl :
            this.defaultImpl;
    }

    __call__(...args) {
        let impl = this.implementationFor(List(args).map(type));
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
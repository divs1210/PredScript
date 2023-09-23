const {NotFound, isNull} = require('./util.js');
const {List, Map, Set, is, getIn, setIn} = require('immutable');

// type hierarchy
// ==============
let hierarchy = Map({
    parents:     Map(),
    ancestors:   Map(),
    descendents: Map()
});

function parentOf(child) {
    return getIn(hierarchy, ['parents', child], NotFound);
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
    if(is(NotFound, parentOf(child))) {
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


// multimethods
// ============
class MultiMethod extends Function {
    constructor(name, dispatchFn) {
        // hack to make objects callable:
        // https://stackoverflow.com/a/40878674/1163490
        super('...args', 'return this.__self__.__call__(...args)');
        var self = this.bind(this);
        this.__self__ = self;

        self.mName = name;
        self.vTable = Map();
        self.dispatchFn = dispatchFn;
        self.defaultImplementation = null;

        return self;
    }

    implement(dispatchVal, f) {
        this.vTable = this.vTable.set(dispatchVal, f);
    }

    setDefault(implementation) {
        this.defaultImplementation = implementation;
    }

    implementation(dispatchVal) {
        // TODO: work with hierarchies better
        // find the implementation for
        // lowest common ancestors
        let dispatchOn = dispatchVal;
        let impl = this.vTable.get(dispatchOn);

        while(isNull(impl) && !is(NotFound, dispatchOn)) {
            dispatchOn = parentOf(dispatchVal);
            impl = this.vTable.get(dispatchOn);
        }

        return !isNull(impl)?
            impl :
            this.defaultImplementation;
    }

    __call__(...args) {
        let dispatchVal = this.dispatchFn(...args);
        let impl = this.implementation(dispatchVal);

        if(!isNull(impl))
            return impl(...args);

        throw new Error(`No implementation of ${this.mName} found for dispatch: ${dispatchVal}!`);
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

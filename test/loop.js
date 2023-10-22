const assert = require('assert/strict');
const { is } = require('immutable');
const { loop, recur } = require('../src/loop');

function sumTill(N) {
    let xs = [...Array(N+1).keys()];

    return loop({ xs: xs, acc: 0 }, ({ xs, acc }) => {
        if (xs.length === 0) {
            return acc;
        } else
            return recur({ 
                xs:  xs.slice(1),
                acc: acc + xs[0]
            });
    });
}

assert(is(
    sumTill(5), 
    5 + 4 + 3 + 2 + 1
));
const Null = {};

function isNull(x) {
    return x === null
        || x === undefined
        || x === Null;
}

function notNull(x) {
    return !isNull(x);
}

module.exports = {
    Null,
    isNull,
    notNull
};

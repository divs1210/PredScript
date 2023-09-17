const NotFound = {};

function isNull(x) {
    return x === null
        || x === undefined;
}

function val(obj) {
    return obj.get('val');
}

module.exports = {
    NotFound,
    isNull,
    val
};

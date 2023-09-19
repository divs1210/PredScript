const NotFound = {};

function isNull(x) {
    return x === null
        || x === undefined;
}

function val(obj) {
    return obj.get('val');
}

function prettify(obj) {
    return JSON.stringify(obj, null, 2);
}

module.exports = {
    NotFound,
    isNull,
    val,
    prettify
};

const path = require('node:path'); 
const fs = require('fs');

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

function pprint(obj) {
    console.log(prettify(obj));
}

module.exports = {
    NotFound,
    isNull,
    val,
    prettify,
    pprint
};

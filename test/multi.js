const assert = require('node:assert/strict');
const {MultiMethod, derive, isA} = require("../src/multi.js");
const {List, is} = require("immutable");


let mtest = new MultiMethod("mtest", (x) => typeof x);

mtest.implement('number', (x) => List(['number', x]));
mtest.setDefault((x) => List(['some', x]));
derive('number', 'bigint');

assert(is(mtest(1),  List(['number', 1])));
assert(is(mtest(2n), List(['number', 2n])));
assert(is(mtest(''), List(['some',   ''])));
assert(isA('number', 'bigint'));

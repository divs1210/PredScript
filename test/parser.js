const assert = require('node:assert/strict');
const { parse } = require("../src/parser");

let ast = parse(`
let n: isReal = 42;
`);
// console.log(JSON.stringify(ast, null, 2));
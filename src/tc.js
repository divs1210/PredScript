const { parse } = require("./parser");

// env
// ===
let baseEnv = {};

// core
// ====
function _tc(ast, env) {
}

// api
// ===
function tc(code, env) {
    let ast = parse(code);
    env = env || baseEnv;
    return _tc(ast, env);
}

module.exports = {
    tc
};
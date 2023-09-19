const { parse } = require("./parser");

function compileAST(ast) {
    console.log(JSON.stringify(ast, null, 2));
}

function compile(codeString) {
    let ast = parse(codeString);
    return compileAST(ast);
}

module.exports = {
    compile
};
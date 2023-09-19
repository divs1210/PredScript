const { is } = require("immutable");
const { parse } = require("./parser");
const { isNull } = require("./util");

function compileLiteral(expr) {
    let val = expr.value;
    switch(typeof val) {
        case 'number': 
            return `Real(${val})`;
        case 'boolean':
            return `Bool(${val})`;
        default: {
            console.error(`Unhandled literal: ${val}`);
            return '????';
        }
    }
}

function compileBinaryExpression(expr) {
    let opToFn = {
        '*': 'times',
        '/': 'div',
        '+': 'add',
        '-': 'sub',
        '<=': 'isLessThanEq'
    };

    let { operator, left, right } = expr;
    let fn = opToFn[operator];

    if (!isNull(fn)) {
        let compiledLeft  = compileAST(left);
        let compiledRight = compileAST(right);    
        return `apply(${fn}, List([${compiledLeft}, ${compiledRight}]))`;   
    } else {
        console.error(`Unhandled binary expression: ${JSON.stringify(expr, null, 2)}`);
        return '????';
    }
}

function compileCallExpression(expr) {
    let args = expr.arguments.map(compileAST).join(', ');
    return `apply(${expr.callee.name}, List([${args}]))`;
}

function compileBlockExpression(expr) {
    let countExprs = expr.body.length;
    if (is(0, countExprs))
        return 'null';
    else if (is(1, countExprs))
        return compileAST(expr.body[0]);
    else {
        let compiledExprs = expr.body.map(compileAST);
        let lastExpr = compiledExprs.pop();
        return `((() => { ${compiledExprs.join('; ')}; return ${lastExpr}; })())`;
    }
}

function compileAST(ast) {
    switch (ast.type) {
        case 'Literal':
            return compileLiteral(ast);
        case 'Identifier':
            return ast.name;
        case 'BinaryExpression':
            return compileBinaryExpression(ast);
        case 'CallExpression':
            return compileCallExpression(ast);
        case 'ExpressionStatement':
            return compileAST(ast.expression);
        case 'BlockStatement':
            return compileBlockExpression(ast);
        default: {
            console.error(`Unhandled AST:\n ${JSON.stringify(ast, null, 2)}`);
            return '????';
        }
    }
}

function compile(codeString) {
    console.log(`Input:\n${codeString}\n`);

    let ast = parse(codeString);
    console.log(`AST:\n${JSON.stringify(ast, null, 2)}\n`);

    let jsCodeString = compileAST(ast);
    console.log(`Compiled:\n${jsCodeString}\n`);

    return jsCodeString;
}

module.exports = {
    compile
};
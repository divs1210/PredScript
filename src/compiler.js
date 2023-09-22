const { is } = require("immutable");
const { parse, parseExpr } = require("./parser");
const { isNull, prettify } = require("./util");
const builtins = require('./builtins');

function compileLiteral(node) {
    let val = node.value;
    switch(node.type) {
        case 'number': 
            return `Real(${val})`;
        case 'bool':
            return `Bool(${val})`;
        case 'null':
            return 'null';
        default: {
            console.error(`Unhandled literal: ${prettify(val)}`);
            return '????';
        }
    }
}

function compileBinaryExpression(node) {
    let opToFn = {
        '*': 'times',
        '/': 'div',
        '+': 'add',
        '-': 'sub',
        '<' : 'isLessThan',
        '<=': 'isLessThanEq',
        '==': 'is',
        '>' : 'isGreaterThan',
        '>=': 'isGreaterThanEq'
    };

    let { op, left, right } = node;
    let fn = opToFn[op];

    if (!isNull(fn)) {
        let compiledLeft  = compileAST(left);
        let compiledRight = compileAST(right);    
        return `_apply(${fn}, List([${compiledLeft}, ${compiledRight}]))`;   
    } else {
        console.error(`Unhandled binary expression: ${prettify(node)}`);
        return '????';
    }
}

function compileIfExpression(expr) {
    let { condExp, thenExp, elseExp } = expr;
    let [cond, then, alt] = [condExp, thenExp, elseExp].map(compileAST);
    return `(_is(TRUE, (${cond}))? (${then}): (${alt}))`;
}

function compileCallExpression(node) {
    let f = compileAST(node.f);
    let args = node.args.map(compileAST).join(', ');
    return `_apply(apply, List([${f}, List([${args}])]))`;
}

function compileBlockExpression(node) {
    let countExprs = node.value.length;
    if (is(0, countExprs))
        return 'null';
    else if (is(1, countExprs))
        return compileAST(node.value[0]);
    else {
        let compiledExprs = node.value.map(compileAST);
        let lastExpr = compiledExprs.pop();
        return `((() => { ${compiledExprs.join('; ')}; return ${lastExpr}; })())`;
    }
}

function compileProgram(node) {
    let allBuiltins = Object.keys(builtins).join(', ');
    let requireBuiltins = `const {${ allBuiltins }} = require('./src/builtins');\n\n`;

    let countExprs = node.value.length;
    if (is(0, countExprs))
        return 'null';
    else if (is(1, countExprs))
        return requireBuiltins + compileAST(node.value[0]);
    else
        return requireBuiltins + node.value.map(compileAST).join("; ") + ";";
}

function compileMultiFn(node) {
    let fName = compileAST(node.name);
    let fReturnType = compileAST(node.retType);
    let fBody = compileAST(node.body);
    let argNames = node.args.map((arg) => compileAST(arg.argName)).join(', ');
    let argTypes = node.args.map((arg) => compileAST(arg.argType)).join(', ');

    return `
var ${fName} = ${fName} || MultiFn("${fName}");
Implement(
    ${fName},
    List([${argTypes}]),
    ${fReturnType},
    (${argNames}) => ${fBody}
);
    `.trim();
}

function compileAST(ast) {
    if(isNull(ast))
        return 'null';

    switch (ast.type) {
        case 'number':
        case 'bool':
        case 'string':
        case 'null':
            return compileLiteral(ast);
        case 'symbol':
            return ast.value;
        case 'binary-exp':
            return compileBinaryExpression(ast);
        case 'if-exp':
            return compileIfExpression(ast);
        case 'call-exp':
            return compileCallExpression(ast);
        case 'block-stmt':
            return compileBlockExpression(ast);
        case 'expr-stmt':
            return compileAST(ast.value);
        case 'multifn-stmt':
            return compileMultiFn(ast);
        case 'program':
            return compileProgram(ast);
        default: {
            console.error(`Unhandled AST:\n ${prettify(ast)}`);
            return '????';
        }
    }
}

function compile(codeString) {
    // console.log(`Input:\n${codeString}\n`);

    let ast = parse(codeString);
    // console.log(`AST:\n${prettify(ast)}\n`);

    let jsCodeString = compileAST(ast);
    // console.log(`Compiled:\n${jsCodeString}\n`);

    return jsCodeString;
}

function compileExpr(codeString) {
    // console.log(`Input:\n${codeString}\n`);

    let ast = parseExpr(codeString);
    // console.log(`AST:\n${prettify(ast)}\n`);

    let jsCodeString = compileAST(ast);
    // console.log(`Compiled:\n${jsCodeString}\n`);
    
    return jsCodeString;
}

module.exports = {
    compile,
    compileExpr
};
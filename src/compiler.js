const { is } = require("immutable");
const { parse, parseExpr } = require("./parser");
const { isNull, prettify } = require("./util");
const builtins = require('./builtins');

function compileLiteral(expr) {
    let val = expr.value;
    switch(typeof val) {
        case 'number': 
            return `Real(${val})`;
        case 'boolean':
            return `Bool(${val})`;
        default: {
            console.error(`Unhandled literal: ${prettify(val)}`);
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
        '<' : 'isLessThan',
        '<=': 'isLessThanEq',
        '=' : 'is',
        '>' : 'isGreaterThan',
        '>=': 'isGreaterThanEq'
    };

    let { operator, left, right } = expr;
    let fn = opToFn[operator];

    if (!isNull(fn)) {
        let compiledLeft  = compileAST(left);
        let compiledRight = compileAST(right);    
        return `_apply(apply, List([${fn}, List([${compiledLeft}, ${compiledRight}])]))`;   
    } else {
        console.error(`Unhandled binary expression: ${prettify(expr)}`);
        return '????';
    }
}

function compileIfExpression(expr) {
    let { test, consequent, alternate } = expr;
    let [cond, then, alt] = [test, consequent, alternate].map(compileAST);
    return `(_apply(is, List([TRUE, (${cond})]))? (${then}): (${alt}))`;
}

function compileCallExpression(expr) {
    let args = expr.arguments.map(compileAST).join(', ');
    return `_apply(apply, List([${expr.callee.name}, List([${args}])]))`;
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

function compileProgram(expr) {
    let allBuiltins = Object.keys(builtins).join(', ');
    let requireBuiltins = `const {${ allBuiltins }} = require('./src/builtins');\n\n`;

    let countExprs = expr.body.length;
    if (is(0, countExprs))
        return 'null';
    else if (is(1, countExprs))
        return requireBuiltins + compileAST(expr.body[0]);
    else
        return requireBuiltins + expr.body.map(compileAST).join("; ") + ";";
}

function compileMultiFn(expr) {
    let fName = expr.id.name;
    let fReturnType = expr?.returnType?.typeAnnotation?.typeName?.name ?? 'isAny';
    let fBody = compileAST(expr.body);
    let args = expr.params.map((arg)=> {
        let argName = arg.name;
        let argType = arg?.typeAnnotation?.typeAnnotation?.typeName?.name ?? 'isAny';
        return {name: argName, type: argType};
    });
    let argNames = args.map((arg) => arg.name).join(', ');
    let argTypes = args.map((arg) => arg.type).join(', ');

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
        case 'Literal':
            return compileLiteral(ast);
        case 'Identifier':
            return ast.name;
        case 'BinaryExpression':
            return compileBinaryExpression(ast);
        case 'IfStatement':
            return compileIfExpression(ast);
        case 'CallExpression':
            return compileCallExpression(ast);
        case 'BlockStatement':
            return compileBlockExpression(ast);
        case 'ExpressionStatement':
            return compileAST(ast.expression);
        case 'FunctionDeclaration':
            return compileMultiFn(ast);
        case 'Program':
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
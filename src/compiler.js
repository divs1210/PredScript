const { is } = require("immutable");
const { parse, parseExpr } = require("./parser");
const { isNull, prettify } = require("./util");
const builtins = require("./builtins");

function compileLiteral(node) {
    let val = node.value;
    switch(node.type) {
        case 'int': 
            return `Int(${val})`;
        case 'real':
            return `Real(${val})`;
        case 'bool':
            return `Bool(${val})`;
        case 'char':
            return `Char('${val}')`;
        case 'string':
            return `String("${val}")`;
        case 'null':
            return `NULL`;
        default: {
            console.error(`Unhandled literal: ${prettify(val)} at ${prettify(node.loc)}`);
            return '????';
        }
    }
}

function compileUnaryExpression(node) {
    let opToFn = {
        '!':  'neg',
        '-':  'neg',
    };

    let { op, value } = node;
    let fn = opToFn[op];

    if (!isNull(fn)) {
        let compiledValue  = compileAST(value);
        return `_apply(${fn}, List(${compiledValue}))`;   
    } else {
        console.error(`Unhandled unary expression: ${prettify(node)} at ${prettify(node.loc)}`);
        return '????';
    }
}


function compileBinaryExpression(node) {
    let opToFn = {
        '*':  'times',
        '/':  'divide',
        '%':  'mod',
        '+':  'add',
        '-':  'minus',
//      '**': 'pow',
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
        return `_apply(${fn}, List(${compiledLeft}, ${compiledRight}))`;
    } else {
        console.error(`Unhandled binary expression: ${prettify(node)} at ${prettify(node.loc)}`);
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

    if (f === 'List')
        return `List(${args})`;
    else if (f === 'Map')
        return `Map(${args})`;

    return `_apply(apply, List(${f}, List(${args})))`;
}

function getExpression(node) {
    let from = compileAST(node.fromExp);
    let key = compileAST(node.keyExp);
    return `_apply(get, List(${from}, ${key}))`;
}

function compileBlockExpression(node) {
    let countExprs = node.value.length;
    if (is(0, countExprs))
        return 'null';
    else {
        let firstLetIdx = node.value.findIndex(subNode => subNode.type === 'let-stmt');

        if (firstLetIdx === -1) {
            let compiledExprs = node.value.map(compileAST);
            let lastExpr = compiledExprs.pop();
            return `((() => { ${compiledExprs.join('; ')}; return ${lastExpr}; })())`;
        } else {
            let compiledBeforeStatements = node.value.slice(0, firstLetIdx).map(compileAST);
            let afterStatements  = node.value.slice(firstLetIdx + 1);
            let compiledInternalBlock = compileBlockExpression({
                type: 'block-exp',
                value: afterStatements
            });
            
            let letNode = node.value[firstLetIdx];
            let varName = compileAST(letNode.varName);
            let varVal  = compileAST(letNode.varVal);
            let varType = compileAST(letNode.varType);
            
            return `((() => { 
                ${compiledBeforeStatements.join('; ')};
                return ((function (${varName}) {
                    return ${compiledInternalBlock};
                })(_check(${varType}, ${varVal})));
            })())`
        }
    }
}

function compileProgram(node) {
    let allBuiltins = Object.keys(builtins).join(', ');
    let requireBuiltins = `var {${ allBuiltins }} = require('predscript/builtins');\n\n`;

    return requireBuiltins + compileBlockExpression(node);
}

function compileMultiFn(node) {
    let fName = compileAST(node.name);
    let fReturnType = compileAST(node.retType);
    let fBody = compileAST(node.body);
    let argNames = node.args.map((arg) => compileAST(arg.argName)).join(', ');
    let argTypes = node.args.map((arg) => compileAST(arg.argType)).join(', ');

    return `
Implement(
    ${fName},
    List(${argTypes}),
    ${fReturnType},
    ${!node.modifiers.memoized? `((${argNames}) => ${fBody})` : `_memoize((${argNames}) => ${fBody})`}
);
    `.trim();
}

function compileInterface(node) {
    return `const ${node.value} = MultiFn("${node.value}")`;
}

function compileAST(ast) {
    if(isNull(ast))
        return 'null';

    switch (ast.type) {
        case 'int':
        case 'real':
        case 'bool':
        case 'char':
        case 'string':
        case 'null':
            return compileLiteral(ast);
        case 'symbol':
            return ast.value;
        case 'unary-exp':
            return compileUnaryExpression(ast);
        case 'binary-exp':
            return compileBinaryExpression(ast);
        case 'if-exp':
            return compileIfExpression(ast);
        case 'call-exp':
            return compileCallExpression(ast);
        case 'get-exp':
            return getExpression(ast);
        case 'block-stmt':
            return compileBlockExpression(ast);
        case 'expr-stmt':
            return compileAST(ast.value);
        case 'multifn-stmt':
            return compileMultiFn(ast);
        case 'interface-stmt':
            return compileInterface(ast);
        case 'program':
            return compileProgram(ast);
        default: {
            console.error(`Unhandled AST ${prettify(ast.type)} at:\n ${prettify(ast.loc)}`);
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
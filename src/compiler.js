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
            return `String(\`${val}\`)`;
        case 'regex':
            return `newRegExp(${val})`;
        case 'null':
            return `NULL`;
        default: {
            console.error(`Unhandled literal: ${prettify(val)} at ${prettify(node.loc)}`);
            return '????';
        }
    }
}

function compileLambdaExpression({ args, body }) {
    let argsStr = args.map(compileAST).join(', ');
    let compiledBody = compileAST(body);
    return `_Lambda((${argsStr}) => { return (${compiledBody}); })`;
}

function compileIfExpression(expr) {
    let { condExp, thenExp, elseExp } = expr;
    let [cond, then, alt] = [condExp, thenExp, elseExp].map(compileAST);
    return `(_is(TRUE, (${cond}))? (${then}): (${alt}))`;
}

function compileLoopExpression({ args, body }) {
    let compiledInit =
        args
        .map(arg => arg.name.value + ': ' + compileAST(arg.value))
        .join(', ');
    
    let compiledArgs =
        args
        .map(arg => arg.name.value)
        .join(', ');
    
    let compiledBody = compileAST(body);

    return `
loop({ ${compiledInit} }, ({ ${compiledArgs} }) => ${compiledBody})
    `.trim();
}

function compileRecurExpression({ args }) {
    let compiledArgs =
        args
        .map(arg => arg.name.value + ': ' + compileAST(arg.value))
        .join(', ');

    return `recur({ ${compiledArgs} })`;
}

function compileListExpression(node) {
    let args = node.args.map(compileAST).join(', ');
    return `List(${args})`;
}

function compileMapExpression(node) {
    let args = node
        .args
        .map(({ k, v }) => [compileAST(k), compileAST(v)])
        .flat(1)
        .join(', ');
    return `Map(${args})`;
}

function compileCallExpression(node) {
    let f = compileAST(node.f);
    let args = node.args.map(compileAST).join(', ');

    return `_apply(apply, List(${f}, List(${args})))`;
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
    let mName = node.name;
    
    let params = "";
    if(node.args.length > 0)
        params = 
            '<' 
            + node.args
              .map(arg => "${(_apply(toString, List(" + arg + "))).get('val')}")
              .join(', ') 
            + '>';
    
    let parent = node.parent || 'null';

    return `const ${node.name} = MultiFn("${mName}" + \`${params}\`, ${parent});`;
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
        case 'regex':
        case 'null':
            return compileLiteral(ast);
        case 'symbol':
            return ast.value;
        case 'list-exp':
            return compileListExpression(ast);
        case 'map-exp':
            return compileMapExpression(ast);
        case 'lambda-exp':
            return compileLambdaExpression(ast);
        case 'if-exp':
            return compileIfExpression(ast);
        case 'loop-exp':
            return compileLoopExpression(ast);
        case 'recur-exp':
            return compileRecurExpression(ast);
        case 'call-exp':
            return compileCallExpression(ast);
        case 'let-stmt':
            throw new Error(`let outside block at:\n ${prettify(ast.loc)}`);
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
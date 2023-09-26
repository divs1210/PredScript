const { is } = require("immutable");
const { parse, parseExpr } = require("./parser");
const { isNull: _isNull, prettify, pprint, val } = require("./util");
const { 
    isNull, isAny, isBool,
    isReal, isInt,
    isString,
    isFn, isPred, isMultiFn, str, _is 
} = require("./builtins");
const { isA } = require("./multi");

// ENV
// ===
const builtinEnv = {
    __parent__: null,
    isNull,
    isAny,
    isBool,
    isReal,
    isInt,
    isString,
    isFn,
    isMultiFn,
    isPred
};

function envMake(parentEnv, bindings) {
    return {
        __parent__: parentEnv,
        ...bindings
    };
}

function envFetch(env, name, loc) {
    if (_isNull(env))
        throw new Error(
            `No definition found for ${name}`
            + ` on line: ${loc.start.line}, col: ${loc.start.column}`
        );
    else if (!_isNull(env[name]))
        return env[name];
    else
        return envFetch(env.__parent__, name, loc);
}


// Unify
// =====
function check(expectedType, actualType, loc) {
    if (!isA(expectedType, actualType))
        throw new Error(
            `Type Error on line: ${loc.start.line}, col: ${loc.start.column}`
            + `\nexpected: ${val(expectedType).mName}`
            + `\n  actual: ${val(actualType).mName}`
        );
}


// TC
// ==
function tcLiteral(node) {
    let val = node.value;
    switch(node.type) {
        case 'int':    return isInt;
        case 'real':   return isReal;
        case 'bool':   return isBool;
        case 'string': return isString;
        case 'null':   return isNull;
        default: {
            console.error(`Unhandled literal: ${prettify(val)} at ${prettify(node.loc)}`);
            return isAny;
        }
    }
}

function tcUnaryExpression(node, env) {
    let opToFn = {
        '!':  'neg',
        '-':  'neg',
    };

    let { op, value } = node;
    let fn = opToFn[op];

    if (!_isNull(fn)) {
        let tcdValue  = tcAST(value, env);
        return isAny;
    } else {
        console.error(`Unhandled unary expression: ${prettify(node)} at ${prettify(node.loc)}`);
        return isAny;
    }
}

function tcBinaryExpression(node, env) {
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

    if (!_isNull(fn)) {
        let tcdLeft  = tcAST(left, env);
        let tcdRight = tcAST(right, env);    
        return isAny;   
    } else {
        console.error(`Unhandled binary expression: ${prettify(node)} at ${prettify(node.loc)}`);
        return isAny;
    }
}

function tcIfExpression(expr, env) {
    let { condExp, thenExp, elseExp } = expr;
    let [cond, then, alt] = [condExp, thenExp, elseExp].map(exp => tcAST(exp, env));
    return isAny;
}

function tcCallExpression(node, env) {
    let f = tcAST(node.f, env);
    let args = node.args.map(exp => tcAST(exp, env)).join(', ');
    return isAny;
}

function tcBlockExpression(node, env) {
    switch (node.value.length) {
        case 0:  return `isNull`;
        case 1:  return tcAST(node.value[0], env);
        default: return tcAST(node.value.at(-1), env);
    }
}

function tcLetStmt(node, env) {
    let varName = node.varName.value;
    let actualType   = tcAST(node.varVal,  env);
    let expectedType = tcAST(node.varType, env);
    
    check(expectedType, actualType, node.loc);
    env[varName] = actualType;
    
    return isNull;
}

function tcProgram(node, env) {
    return isAny;
}

function tcMultiFn(node, env) {
    let fName = node.name.value;
    let argNames = node.args.map(arg => arg.argName.value);
    let argTypes = node.args.map(arg => arg.argType.value);
    let isPred = (node.args.length === 1) && (fReturnType === 'isBool');

    // do this before evaluating body
    // in case of recursion
    if(isPred)
        env[fName] = isPred;

    let fReturnType = node.retType.value;    
    let fBody = tcAST(node.body);

    return isAny;
}

function tcAST(ast, env) {
    if(_isNull(ast))
        return isNull;

    switch (ast.type) {
        case 'int':
        case 'real':
        case 'bool':
        case 'string':
        case 'null':
            return tcLiteral(ast);
        case 'symbol':
            return envFetch(env, ast.value, ast.loc);
        case 'unary-exp':
            return tcUnaryExpression(ast, env);
        case 'binary-exp':
            return tcBinaryExpression(ast, env);
        case 'if-exp':
            return tcIfExpression(ast, env);
        case 'call-exp':
            return tcCallExpression(ast, env);
        case 'block-stmt':
            return tcBlockExpression(ast, env);
        case 'expr-stmt':
            return tcAST(ast.value, env);
        case 'multifn-stmt':
            return tcMultiFn(ast, env);
        case 'let-stmt':
            return tcLetStmt(ast, env);
        case 'program':
            return tcProgram(ast, env);
        default: {
            console.error(`Unhandled AST ${prettify(ast.type)} at:\n ${prettify(ast.loc)}`);
            return isAny;
        }
    }
}

function tc(codeString) {
    // console.log(`Input:\n${codeString}\n`);

    let ast = parse(codeString);
    // console.log(`AST:\n${prettify(ast)}\n`);

    let jsCodeString = tcAST(ast, builtinEnv);
    // console.log(`tcd:\n${jsCodeString}\n`);

    return jsCodeString;
}

function tcExpr(codeString) {
    // console.log(`Input:\n${codeString}\n`);

    let ast = parseExpr(codeString);
    // console.log(`AST:\n${prettify(ast)}\n`);

    let jsCodeString = tcAST(ast, builtinEnv);
    // console.log(`tcd:\n${jsCodeString}\n`);
    
    return jsCodeString;
}

// console.log('tc: ' + val(tcExpr(`
// let a: isInt = 5;
// `)).mName);

module.exports = {
    tc,
    tcExpr
};
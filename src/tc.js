const { parse, parseExpr } = require("./parser");
const { isNull: _isNull, prettify, val } = require("./util");
const builtins = require("./builtins");
const { 
    isNull, isAny, isBool,
    isReal, isInt,
    isString,
    isMultiFn, 
    _type, 
    apply, 
    union
} = builtins;
const { isA } = require("./multi");


// ENV
// ===
const builtinEnv = [
    // predicates
    'isNull',
    'isAny',
    'isBool',
    'isReal',
    'isInt',
    'isString',
    'isFn',
    'isMultiFn',
    'isPred',

    // others
    'type',

    'neg',
    'add',
    'minus',
    'times',
    'divide',
    'mod',

    'is',
    'isLessThan',
    'isLessThanEq',
    'isGreaterThan',
    'isGreaterThanEq',

    'str',
    'apply',

    // higher order preds
    'union',

    // IO
    'println'
]
.reduce((acc, x) => {
    let v = eval(`builtins['${x}']`);
    acc[x] = {
        type: _type(v),
        val: v
    }
    return acc;
}, {__parent__: null});

function envMake(parentEnv, bindings) {
    return {
        __parent__: parentEnv,
        ...bindings
    };
}

function envFetch(env, name, loc, dontThrow) {
    if (_isNull(env)) {
        if(dontThrow)
            return null;
        else
            throw new Error(
                `No definition found for ${name}`
                + ` on line: ${loc.start.line}, col: ${loc.start.column}`
            );
    } else if (!_isNull(env[name]))
        return env[name];
    else
        return envFetch(env.__parent__, name, loc, dontThrow);
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
    else
        return actualType;
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
        return tcCallExpression({
            type: 'call-exp',
            f: {
                type: 'symbol',
                value: fn,
                loc: node.loc
            },
            args: [value],
            loc: node.loc
        }, env);
    } else {
        console.error(`Unhandled unary operator on line: ${node.loc.start.line}, col: ${node.loc.start.column}`);
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
//      '**': 'pow', TODO: add to parser
        '<' : 'isLessThan',
        '<=': 'isLessThanEq',
        '==': 'is',
        '>' : 'isGreaterThan',
        '>=': 'isGreaterThanEq'
    };

    let { op, left, right } = node;
    let fn = opToFn[op];

    if (!_isNull(fn)) {
        return tcCallExpression({
            type: 'call-exp',
            f: {
                type: 'symbol',
                value: fn,
                loc: node.loc
            },
            args: [left, right],
            loc: node.loc
        }, env);
    } else {
        console.error(`Unknown binary operator on line: ${node.loc.start.line}, col: ${node.loc.start.column}`);
        return isAny;
    }
}

function tcIfExpression(node, env) {
    let { condExp, thenExp, elseExp } = node;
    elseExp = elseExp || {
        type: 'null', 
        value: null,
        loc: node.loc
    };

    let [condType, thenType, elseType] = 
        [condExp, thenExp, elseExp].map(exp => tcAST(exp, env));

    check(isBool, condType, condExp.loc);
    check(isAny,  thenType, thenExp.loc);
    check(isAny,  elseType, elseExp.loc);

    return val(union)(thenType, elseType);
}

function tcCallExpression(node, env) {
    let multiFn = tcAST(node.f, env);

    // check if f can be applied
    let psFType = _type(multiFn);
    let applyImpls = val(apply).impls;
    let isImpl = applyImpls.some(impl =>
        isA(impl.argTypes.get(0), psFType));
    if(!isImpl)
        throw new Error(
            `Type Error on line: ${node.loc.start.line}, col: ${node.loc.start.column}`
            + `\nNo implementation of apply found for: ${val(psFType).mName}.`
            + `\nIt can not be used as a function.`
        );

    let argTypes = builtins._List(node.args).map(arg => tcAST(arg, env));
    let argTypesStr = '[' + argTypes.map(t => val(t).mName).join(", ") + ']';
    let actualImpl = val(multiFn).implementationFor(argTypes);
    if(!actualImpl) {
        throw new Error(
            `Type Error on line: ${node.loc.start.line}, col: ${node.loc.start.column}`
            + `\nNo matching implementation of ${val(multiFn).mName} found for args: ${argTypesStr}`
        );
    }

    return actualImpl.retType;
}

function tcBlockExpression(node, env) {
    switch (node.value.length) {
        case 0:  return isNull;
        case 1:  return tcAST(node.value[0], env);
        default: {
            return node
            .value
            .map(expr => check(isAny, tcAST(expr, env)))
            .pop();
        }
    }
}

function tcLetStmt(node, env) {
    let varName      = node.varName.value;
    let actualType   = tcAST(node.varVal,  env);
    let expectedType = tcAST(node.varType, env);
    
    check(expectedType, actualType, node.loc);

    // dummy obj in env
    env[varName] = {
        type: actualType,
        val:  builtins.Obj('__unknown__', actualType)
    };
    
    return isNull;
}

function tcProgram(node, env) {
    return tcBlockExpression(node, env);
}

function tcMultiFn(node, env) {
    let fName = node.name.value;
    let fReturnType = tcAST(node.retType, env);

    // do this before evaluating body
    // in case of recursion
    let isPred = (node.args.length === 1) && (fReturnType === isBool);
    let multiType = isPred? isPred : isMultiFn;

    // define dummy multimethod if not already defined
    let existingMulti = envFetch(env, fName, node.loc, true);
    if(!existingMulti)
        env[fName] = {
            type: multiType,
            val: builtins.MultiFn(fName)
        };
    
    let argNames = node.args.map(arg => arg.argName.value);
    let argTypes = node.args.map(arg => tcAST(arg.argType, env));
    
    let argPairs = {};
    for (let i = 0; i < node.args.length; i++)
        argPairs[argNames[i]] = argTypes[i];

    let fnEnv = envMake(env, argPairs);
    let fBodyReturnType = tcBlockExpression(node.body, fnEnv);

    // implement dummy multi
    // before checking body
    // in case of recursion
    builtins.Implement(
        env[fName].val,
        builtins.List([argTypes]),
        fReturnType,
        _ => null
    );

    check(fReturnType, fBodyReturnType, node.loc);

    return isNull;
}

function tcAST(ast, env) {
    env = env || builtinEnv;

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
            return envFetch(env, ast.value, ast.loc).val;
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

// function tc(codeString) {
//     // console.log(`Input:\n${codeString}\n`);

//     let ast = parse(codeString);
//     // console.log(`AST:\n${prettify(ast)}\n`);

//     let jsCodeString = tcAST(ast, builtinEnv);
//     // console.log(`tcd:\n${jsCodeString}\n`);

//     return jsCodeString;
// }

// function tcExpr(codeString) {
//     // console.log(`Input:\n${codeString}\n`);

//     let ast = parseExpr(codeString);
//     // console.log(`AST:\n${prettify(ast)}\n`);

//     let jsCodeString = tcAST(ast, builtinEnv);
//     // console.log(`tcd:\n${jsCodeString}\n`);
    
//     return jsCodeString;
// }

// console.log('tc: ' + val(tc(`
// // let
// let a: isInt = 5;

// // block
// let x: isInt = { "hello"; 1; };

// // function
// function haba(x: isInt): isString {
//    "hello";
// }

// // fn calls
// let t: isPred = type(1);

// // multifn calls (+ is a call to add)
// // let sum: isReal = 1 + 2.4;

// // casting
// // let sum: isReal = AS(isReal, true);
// `)).mName);


module.exports = {
    tcAST
};
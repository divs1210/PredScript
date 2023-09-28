const { parse } = require("./parser");
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
const { is } = require("immutable");


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
    'println',

    // casting
    'as',
    'AS',
    '__AS__'
]
.reduce((acc, x) => {
    let v = builtins[x];
    let t = _type(v);
    // fns are their own type
    acc[x] = isA(builtins.isFn, t)? v: t;
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

// TODO:
// special case AS and __AS__
function tcCallExpression(node, env) {
    let calleeType = tcAST(node.f, env);
    let argTypes = builtins._List(node.args).map(arg => tcAST(arg, env));

    // if it is a Fn, find its correct implementation
    // and return its return type
    if(isA(builtins.isFn, calleeType)) {
        // convert Fns in argTypes to isFn
        let actualArgTypes = argTypes.map(argType =>
            isA(builtins.isFn, argType)? builtins.isFn : argType);
        let actualImpl = val(calleeType).implementationFor(actualArgTypes);
        if(!actualImpl) {
            let argTypesStr = '[' + argTypes.map(t => val(t).mName).join(", ") + ']';
            throw new Error(
                `Type Error on line: ${node.loc.start.line}, col: ${node.loc.start.column}`
                + `\nNo matching implementation of ${val(calleeType).mName} found for args: ${argTypesStr}`
            );
        }
        return actualImpl.retType;
    } else {
        // check if it can be called,
        // ie apply is implemented for it
        let applyImpls = val(apply).impls;
        let isImpl = applyImpls.some(impl =>
            isA(impl.argTypes.get(0), calleeType));
        
        if(!isImpl)
            throw new Error(
                `Type Error on line: ${node.loc.start.line}, col: ${node.loc.start.column}`
                + `\nNo implementation of apply found for: ${val(calleeType).mName}.`
                + `\nIt can not be used as a function.`
            );
        else // TODO
            throw new Error('Not implemented!');
    }
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

    env[varName] = actualType;
    
    return isNull;
}

function tcProgram(node, env) {
    return tcBlockExpression(node, env);
}

function tcMultiFn(node, env) {
    let fName = node.name.value;
    let fReturnType = tcAST(node.retType, env);

    // define dummy multimethod if not already defined
    let existingBinding = envFetch(env, fName, node.loc, true);
    let existingFn;
    // binding doesn't exist
    if(!existingBinding) {
        existingFn = builtins.MultiFn(fName);
        env[fName] = existingFn;
    } // existing binding is a type, ie not a Fn value
    else if(val(builtins.isPred)(existingBinding)) {
        throw new Error(
            `Error on line: ${node.loc.start.line}, col: ${node.loc.start.column}`
            + `\n${val(fName)} is already defined with type ${val(existingBinding).mName}.`
        );
    } // else binding exists and is a multifn
    existingFn = existingBinding;
    
    let argNames = node.args.map(arg => arg.argName.value);
    let argTypes = node.args.map(arg => tcAST(arg.argType, env));
    
    let envArgs = {};
    for (let i = 0; i < node.args.length; i++)
        envArgs[argNames[i]] = argTypes[i];

    let fnEnv = envMake(env, envArgs);
    let fBodyReturnType = tcBlockExpression(node.body, fnEnv);

    // implement dummy fn
    // before checking body
    // in case of recursion
    builtins.Implement(
        existingFn,
        // convert multis in argtypes to isFn
        builtins.List(argTypes.map(argType =>
            val(builtins.isPred)(argType)? argType: builtins.isFn)),
        // convert to isMultiFn if multi
        fReturnType,
        // no f
        null
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
            console.error(`Unhandled AST on line: ${ast.loc.start.line}, col: ${ast.loc.start.column}: ${prettify(ast.type)}`);
            return isAny;
        }
    }
}

// UTIL
// ====


// TEST
// ====
console.log('tc: ' + val(tcAST(parse(`
null;

// let
// let a: isInt = 5;

// block
// let x: isInt = { "hello"; 1; };

// function
// function haba(x: isInt): isString {
//    "hello";
// }

// fn calls
// let t: isPred = type(1);

// multifn calls (+ is a call to add)
// let sum: isReal = 1 + 2.4;

// casting
// let sum: isReal = AS(isReal, true);
`))).mName);


module.exports = {
    tcAST
};
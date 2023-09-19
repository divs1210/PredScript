const { parse } = require("./parser");

function compileBinaryExpression(expr) {
    let { operator, left, right } = expr;
    let compiledLeft  = compileAST(left);
    let compiledRight = compileAST(right);
    switch (operator) {
        case '*':  return `times(${compiledLeft}, ${compiledRight})`;
        case '+':  return `add(${compiledLeft}, ${compiledRight})`;
        case '<=': return `isLessThanEq(${compiledLeft}, ${compiledRight})`;
    }
}

function compileAST(ast) {
    console.log(JSON.stringify(ast, null, 2));

    switch (ast.type) {
        case 'Identifier': {
            return ast.name;
        }
        case 'ExpressionStatement': {
            let expr = ast.expression;
            switch (expr.type) {
                case 'Literal': {
                    let exprVal = expr.value;
                    switch(typeof exprVal) {
                        case 'number': 
                            return `Real(${expr.value})`;
                        case 'boolean':
                            return `Bool(${expr.value})`;
                    }
                }
                case 'BinaryExpression':
                    return compileBinaryExpression(expr);
            }
        }
        case 'BinaryExpression':
            return compileBinaryExpression(ast);
        default: {
            console.error(`Unhandled AST:\n ${JSON.stringify(ast, null, 2)}`);
            return '';
        }
    }
}

function compile(codeString) {
    let ast = parse(codeString);
    return compileAST(ast);
}

module.exports = {
    compile
};
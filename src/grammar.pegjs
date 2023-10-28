{
    const nullNode = {
        type: 'null', 
        value: null,
        loc: location()
    };

    function intNode(parsed) {
        return {
            type: 'int',
            value: parseInt(parsed.join('')),
            loc: location()
        };
    }

    function realNode(parsed) {
        return {
            type: 'real', 
            value: parseFloat(parsed.flat(2).join('')),
            loc: location()
        };
    }

    function boolNode(parsed) {
        return {
            type: 'bool', 
            value: parsed === 'true'? true : false,
            loc: location()
        };
    }

    function charNode(parsed) {
        let str = stringNode(parsed).value;

        // correctly handle unicode
        let chars = [...str];

        if (chars.length === 0 
         || chars[0] !== '\\' && chars.length > 1
         || chars[0] === '\\' && chars.length !== 2)
            throw new Error(`Invalid character literal: '${str}' at ${JSON.stringify(location(), null, 2)}.`);

        return {
            type: 'char', 
            value: chars[0] === '\\' ? chars.slice(0, 2).join('') : chars[0],
            loc: location()
        };
    }

    function stringNode(parsed) {
        return {
            type: 'string', 
            value: parsed[1]
                .flat(1)
                .join(''),
            loc: location()
        };
    }

    function symbolNode(parsed) {
        return {
            type: 'symbol', 
            value: parsed.flat(1).join(''),
            loc: location()
        };
    }

    function listNode(args) {
        let flattenedArgs = 
            (!args || args.length === 0)? []
          : (args.length === 1)? [args[0]]
          : [args[0]].concat(args[1].map(arg => arg[3]));
        
        return {
            type: 'list-exp',
            args: flattenedArgs,
            loc:  location()                
        };
    }

    function mapNode(args) {
        let flattenedArgs = 
            (!args || args.length === 0)? []
          : (args.length === 1)? [args[0]]
          : [args[0]].concat(args[1].map(arg => arg[3]));

        return {
            type: 'map-exp',
            args: flattenedArgs,
            loc:  location()
        };
    }

    function blockNode(parsed) {
        return {
            type: 'block-stmt', 
            value: parsed.map(arr => arr[1]),
            loc: location()
        };
    }

    // internal node
    function fnCallArgsNode(args) {
        if(!args || args.length === 0)
            return [];
        else if (args.length === 1)
            return [args[0]];
        else 
            return [args[0]].concat(args[1].map(arg => arg[3]));
    }

    function fnCallNode(f, argLists) {
        if (argLists.length === 1)
            return {
                type: 'call-exp', 
                f:    f,
                args: argLists[0],
                loc: location()
            };
        return fnCallNode(
            fnCallNode(f, [argLists[0]]),
            argLists.slice(1)
        );
    }

    function loopExprNode(args, body) {
        return {
            type: 'loop-exp',
            args: args,
            body: body,
            loc:  location()
        };
    }

    function recurExprNode(args) {
        return {
            type: 'recur-exp',
            args: args,
            loc:  location()
        };
    }

    function ifNode(cond, then, _else) {
        return {
            type: 'if-exp',
            condExp: cond,
            thenExp: then,
            elseExp: _else? _else[3]: null,
            loc: location()
        };
    }

    function lambdaNode(args, body) {
        if (!args || args.length === 0)
            return {
                type: 'lambda-exp',
                args: [],
                body: body
            };
        else {
            let restArgs = args[1];

            if (!restArgs || restArgs.length === 0)
                return {
                    type: 'lambda-exp',
                    args: [args[0]],
                    body: body
                };
            else
                return {
                    type: 'lambda-exp',
                    args: [args[0], ...restArgs.map(arg => arg[3])],
                    body: body
                };
        }
    }

    function unaryNode(op, x) {
        let opToFn = {
            '!':  'neg',
            '-':  'neg'
        };

        let f = opToFn[op];

        return {
            type: 'call-exp', 
            f: {
                type: 'symbol', 
                value: f,
                loc: location()
            },
            args: [x],
            loc:  location()
        };
    }

    function binaryNode(x, pairs) {
        if (pairs.length === 0)
            return x;

        let opToFn = {
            '*':  'times',
            '/':  'divide',
            '%':  'mod',
            '+':  'add',
            '-':  'minus',
            '**': 'pow',
            '<' : 'isLessThan',
            '<=': 'isLessThanEq',
            '==': 'is',
            '!=': 'isNot',
            '>' : 'isGreaterThan',
            '>=': 'isGreaterThanEq'
        };

        let [op, _, p0] = pairs[0];
        let f = opToFn[op];
        return binaryNode(
            {
                type:  'call-exp',
                f: {
                    type: 'symbol', 
                    value: f,
                    loc: location()
                },
                args: [x, p0],
                loc: location()
            },
            pairs.slice(1)
        );
    }

    function logicNode(x, pairs) {
        if (pairs.length === 0)
            return x;

        let [op, _, y] = pairs[0];
        return logicNode(
            {
                type: 'if-exp',
                condExp: x,
                thenExp: op === '&&'? y : x,
                elseExp: op === '&&'? x : y,
                loc: location()
            },
            pairs.slice(1)
        );
    }

    function multiFnArgNode(obj) {
        obj.type = 'multifn-arg';
        obj.loc = location();
        return obj;
    }

    function getExprNode(from, keys) {
        if(keys.length === 1)
            return {
                type: 'call-exp',
                f: {
                    "type": "symbol",
                    "value": "get",
                    "loc": location()
                },
                args: [
                    from,
                    keys[0][2]
                ],
                loc: location()
            };

        return getExprNode(
            getExprNode(
                from,
                [keys[0]]
            ),
            keys.slice(1)
        );
    }

    // intermediate node
    function dotNotation(startNode, rightNodes) {
        rightNodes = (rightNodes || []).map(node => node[3]);
        
        let transformedStartNode =  {
            type: 'let-stmt',
            varName: {
                type: 'symbol', 
                value: '$this',
                loc: location()
            },
            varType: {
                type: 'symbol', 
                value: 'isAny',
                loc: location()
            },
            varVal:  startNode,
            loc: location()
        };

        let transformedRightNodes = rightNodes.map(node => {
            if (node.type === 'symbol')
                node = {
                    type: 'call-exp',
                    f: {
                        "type": "symbol",
                        "value": node.value,
                        "loc": location()
                    },
                    args: [ 
                        {
                            type: 'symbol', 
                            value: '$this',
                            loc: location()
                        }],
                    loc: location()
                };

            return {
                type: 'let-stmt',
                varName: {
                    type: 'symbol', 
                    value: '$this',
                    loc: location()
                },
                varType: {
                    type: 'symbol', 
                    value: 'isAny',
                    loc: location()
                },
                varVal: node,
                loc: location()
            };
        });

        let blockNode = {
            type: 'block-stmt',
            value: [
                transformedStartNode, 
                ...transformedRightNodes,
                {
                    type: 'symbol', 
                    value: '$this',
                    loc: location()
                }
            ],
            loc: location()
        }

        return blockNode;
    }

    // intermediate node
    function multiFnArgsNode(obj) {
        return {
            type: 'multifn-args',
            args: [obj.x].concat(obj.xs.map(arr => arr[3])),
            loc: location()
        };
    }

    function multiFnNode(obj) {
        return {
            type: 'multifn-stmt',
            modifiers: {
                memoized: obj.memo? true: false
            },
            name: obj.fname,
            args: obj.args[2]?.args || [],
            body: obj.body,
            retType: obj.retType,
            loc: location()
        }
    }

    function letNode(obj) {
        return {
            type:    'let-stmt',
            varName: obj.name,
            varType: obj.type,
            varVal:  obj.val,
            loc: location()
        };
    }

    function groupingNode(expr) {
        return expr;
    }

    function exprStatementNode(expr) {
        return {
            type: 'expr-stmt',
            value: expr,
            loc: location()
        };
    }

    function statementNode(stmt) {
        return {
            type: 'stmt',
            value: stmt,
            loc: location()
        };
    }

    function programNode(p) {
        return {
            type: 'program',
            value: p.map(s => s[1]),
            loc: location()
        };
    }
    
    function interfaceNode(name, args, e) {
        if (!args)
            args = [];
        else if (args[2][1].length === 0)
            args = [args[2][0]];
        else
            args = [args[2][0]].concat(args[2][1].map(arg => arg[3]));

        let parent = e && e[3];

        return {
            type: 'interface-stmt',
            name: name.value,
            args: args.map(arg => arg.value),
            parent: parent?.value,
            loc: location()
        }
    }
}

program   = p:((_ statement _)*)                                                               { return programNode(p);                                     }

statement        = s:(interfaceStatement / letStatement / multiFnStatement / exprStatement) // { return statementNode(s);                                   }
exprStatement    = e:expression (_ ';')?                                                       { return exprStatementNode(e);                               }
letStatement     = 'let' __ name:SYMBOL _ ':' _ type:SYMBOL _ '=' _ val:expression (_ ';')?    { return letNode({ name, type, val });                       }

interfaceStatement = 
    'interface' 
    __ name:SYMBOL args:(_ '<' ((SYMBOL (_ ',' _ SYMBOL)*)?) _ '>')? 
    e:(_ 'extends' _ SYMBOL)? (_ ';')?                                                         { return interfaceNode(name, args, e);                       }

multiFnStatement = memo:('memoized'?) _ 'function' __ fname:SYMBOL _ args:('(' _ multiFnArgs? _ ')') _ ':' _ retType:SYMBOL _ body:block
                                                                                               { return multiFnNode({ memo, fname, args, retType, body });  }

multiFnArgs      = x:multiFnArg xs:((_ ',' _ multiFnArg)*)                                     { return multiFnArgsNode({ x, xs });                         }
multiFnArg       = argName:SYMBOL _ ':' _ argType:SYMBOL                                       { return multiFnArgNode({ argName, argType });               }

expression = logic
logic      = x:equality _ pairs:(( ( '&&' / '||' ) _ equality)*)        { return logicNode(x, pairs);   }
equality   = x:comparison _ pairs:(( ( '==' / '!=' ) _ comparison)*)    { return binaryNode(x, pairs);  }
comparison = x:term   _ pairs:(( ( '>=' / '>' / '<=' / '<' ) _ term)*)  { return binaryNode(x, pairs);  }
term       = x:factor _ pairs:(( ( '-' / '+' ) _ factor)*)              { return binaryNode(x, pairs);  }
factor     = x:unary  _ pairs:(( ( '**' / '/' / '*' / '%' ) _ unary)*)  { return binaryNode(x, pairs);  }
unary      = op:( '!' / '-' ) _ x:unary                                 { return unaryNode(op, x);      }
             / dotNotation
             / lambdaExpr
             / ifExpr
             / getExpr
             / loopExpr
             / recurExpr
             / fnCall
             / primary

ifExpr     = 'if' _ '(' _ cond:expression _ ')' _ then:expression _else:((_ 'else' _ expression)?)
                                                                                     { return ifNode(cond, then, _else); }

lambdaExpr = '(' _ args:((SYMBOL (_ ',' _ SYMBOL)*)?) _ ')' _ '=>' _ body:expression { return lambdaNode(args, body);     }

getExpr    = f:fromExpr _ ks:(keyExpr+)                                              { return getExprNode(f, ks);         }
fromExpr   = fnCall / LIST / MAP / SYMBOL / STRING
keyExpr    = '[' _ expression _ ']'

fnCall     = f:primary _ argLists:(fnCallArgs+)                                      { return fnCallNode(f, argLists);    }
fnCallArgs = '(' _ args:((expression (_ ',' _ expression)*)?) _ ')'                  { return fnCallArgsNode(args);       }

loopExpr     = 'loop'  _ '(' _ args:loopExprArgs _ ')' _ body:block                  { return loopExprNode(args, body);   }
recurExpr    = 'recur' _ '(' _ args:loopExprArgs _ ')'                               { return recurExprNode(args);        }
loopExprArgs = first:loopExprArg rest:(_ ',' _ loopExprArg)* { 
    rest = rest || []; 
    return [first, ...rest.map(arg => arg[3])];
}
loopExprArg  = name:SYMBOL _ '=' _ value:expression                                  { return { name, value };            }

dotNotation = x:(fnCall / getExpr / primary) y:(_ '.' _ (fnCall / grouping / SYMBOL))+         
                                                                                    { return dotNotation(x, y);          }

primary    = REAL / INTEGER / CHAR / STRING / BOOL / NULL / SYMBOL / LIST / MAP / block / grouping

grouping   = '(' _ e:expression _ ')'                                                { return groupingNode(e);            }
block      = '{' _ b:((_ statement _)*) _ '}'                                        { return blockNode(b);               }

LIST      = '[' _ args:((expression (_ ',' _ expression)*)?) _ ']'                   { return listNode(args);             }

MAP       = '{' _ args:((MAPARG (_ ',' _ MAPARG)*)?) _ '}'                           { return mapNode(args);              }
MAPARG    = k:expression _ ':' _ v:expression                                        { return { k, v };                   }

NULL        = 'null'                                           { return nullNode;      }
INTEGER     = i:([0-9]+)                                       { return intNode(i);    }
REAL        = n:([0-9]+ '.' [0-9]+)                            { return realNode(n);   }
BOOL        = b:('true' / 'false')                             { return boolNode(b);   } 

CHAR        = c:("'" ([^'\\] / ('\\' .))* "'")                 { return charNode(c);   }
STRING      = s:('"' ([^"\\] / ('\\' .))* '"')                 { return stringNode(s); }

SYMBOL      = s:(SYMBOLSTART (SYMBOLSTART / [0-9])*)           { return symbolNode(s); }
SYMBOLSTART = [a-zA-Z] / '$' / '_'

_  = __*
__ = (SPACE / COMMENT)+
SPACE = [ \t\r\n]
COMMENT = '//' (![\n\r] .)*
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

    function stringNode(parsed) {
        return {
            type: 'string', 
            value: parsed[1].map(x => x[1]).join(''),
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
        else if(args.slice(1)[0].length > 0)
            return [args[0]].concat(restArgs.map(arg => arg[0]));
        else
            return [args[0]];
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

    function ifNode(cond, then, _else) {
        return {
            type: 'if-exp',
            condExp: cond,
            thenExp: then,
            elseExp: _else? _else[3]: null,
            loc: location()
        };
    }

    function unaryNode(op, x) {
        return {
            type:  'unary-exp', 
            op:    op,
            value: x,
            loc: location()
        };
    }

    function binaryNode(x, pairs) {
        if (pairs.length === 0)
            return x;
        
        let [op, _, p0] = pairs[0];
        return binaryNode(
            {
                type:  'binary-exp',
                op:    op,
                left:  x,
                right: p0,
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
            name: obj.fname,
            args: obj.args[2].args,
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
}

program   = p:((_ statement _)*)                                                               { return programNode(p);                                 }

statement        = s:(letStatement / multiFnStatement / exprStatement)                      // { return statementNode(s);                               }
exprStatement    = e:expression (_ ';')?                                                       { return exprStatementNode(e);                           }
letStatement     = 'let' __ name:SYMBOL _ ':' _ type:SYMBOL _ '=' _ val:expression (_ ';')?    { return letNode({ name, type, val });                   }                   
multiFnStatement = 'function' __ fname:SYMBOL _ args:('(' _ multiFnArgs? _ ')') _ ':' _ retType:SYMBOL _ body:block
                                                                                               { return multiFnNode({ fname, args, retType, body});     }
multiFnArgs      = x:multiFnArg xs:((_ ',' _ multiFnArg)*)                                     { return multiFnArgsNode({ x, xs });                     }
multiFnArg       = argName:SYMBOL _ ':' _ argType:SYMBOL                                       { return multiFnArgNode({ argName, argType });           }

expression = equality
equality   = x:comparison _ pairs:(( ( '!=' / '==' ) _ comparison)*)    { return binaryNode(x, pairs);  }
comparison = x:term   _ pairs:(( ( '>=' / '>' / '<=' / '<' ) _ term)*)  { return binaryNode(x, pairs);  }
term       = x:factor _ pairs:(( ( '-' / '+' ) _ factor)*)              { return binaryNode(x, pairs);  }
factor     = x:unary  _ pairs:(( ( '/' / '*' / '%' ) _ unary)*)         { return binaryNode(x, pairs);  }
unary      = op:( '!' / '-' ) _ x:unary                                 { return unaryNode(op, x);      }
             / ifExpr
             / fnCall
             / primary

ifExpr     = 'if' _ '(' _ cond:expression _ ')' _ then:expression _else:((_ 'else' _ expression)?)
                                                                                     { return ifNode(cond, then, _else); }
fnCall     = f:primary _ argLists:(fnCallArgs+)                                      { return fnCallNode(f, argLists);   }
fnCallArgs = '(' _ args:((expression (_ ',' _ expression)*)?) _ ')'                  { return fnCallArgsNode(args);      }

primary    = REAL / INTEGER / STRING / BOOL / NULL / SYMBOL / block / grouping
grouping   = '(' _ e:expression _ ')'                                                { return groupingNode(e);           }
block      = '{' _ b:((_ statement _)*) _ '}'                                        { return blockNode(b);              }

INTEGER     = i:([0-9]+)                                       { return intNode(i);    }
REAL        = n:([0-9]+ '.' [0-9]+)                            { return realNode(n);   }
BOOL        = b:('true' / 'false')                             { return boolNode(b);   } 
NULL        = 'null'                                           { return nullNode;      }
STRING      = s:('"' (!'"' .)* '"')                            { return stringNode(s); }
SYMBOL      = s:(SYMBOLSTART (SYMBOLSTART / [0-9])*)           { return symbolNode(s); }
SYMBOLSTART = [a-zA-Z] / '$' / '_'

_  = __*
__ = [ \r\t\n]+
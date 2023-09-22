{
    const nullNode = {type: 'null', value: 'null'};

    function numberNode(parsed) {
        let ret = parseFloat(parsed.flat(2).join(''));
        return {type: 'number', value: ret};
    }

    function boolNode(parsed) {
        let ret = parsed === 'true'? true : false;
        return {type: 'bool', value: ret};
    }

    function stringNode(parsed) {
        let ret = parsed[1].map(x => x[1]).join('');
        return {type: 'string', value: ret};
    }

    function symbolNode(parsed) {
        let ret = parsed.flat(1).join('');
        return {type: 'symbol', value: ret};
    }

    function blockNode(parsed) {
        console.log('parsed block: '+JSON.stringify(parsed, null, 2));
        let ret = parsed;
        console.log('ret: '+ret);
        return {type: 'block', value: ret};
    }

    function fnCallNode(parsed) {
        console.log('parsed call: '+JSON.stringify(parsed, null, 2));
        let ret = parsed;
        console.log('ret: '+ret);
        return {type: 'call', value: ret};
    }

    function ifNode(cond, then, _else) {
        let _in = {cond, then, _else};
        console.log('parsed if: '+JSON.stringify(_in, null, 2));
        let ret = _in;
        console.log('ret: '+ret);
        return {type: 'if', value: ret};
    }

    function unaryNode(op, x) {
        let ret = {op, x};
        console.log('parsed un:'+JSON.stringify(ret, null, 2));
        return {type: 'unary-op', value: ret};
    }

    function binaryNode(x, pairs) {
        let ret = {x, pairs};
        
        if (pairs.length === 0)
            return x;

        let [op, _, expr] = pairs[0];
        return {type: 'binary-op', left: x, op: op, right: expr};
    }

    function multiFnArgNode(obj) {
        obj.type = 'multiFnArg';
        return obj;
    }

    function multiFnArgsNode(obj) {
        return {
            type: 'multiFnArgsNode',
            args: [obj.x].concat(obj.xs.map(arr => arr[3]))
        };
    }
}

program   = (_ statement _)*

statement        = letStatement / multiFnStatement / exprStatement
exprStatement    = expression (_ ';')?
letStatement     = 'let' __ SYMBOL _ '=' _ expression (_ ';')?                       
multiFnStatement = 'function' __ SYMBOL _ '(' _ multiFnArgs? _ ')' _ block           
multiFnArgs      = x:multiFnArg xs:((_ ',' _ multiFnArg)*)                           { return multiFnArgsNode({ x, xs });           }
multiFnArg       = argName:SYMBOL _ ':' _ argType:SYMBOL                             { return multiFnArgNode({ argName, argType }); }

expression = equality
equality   = x:comparison _ pairs:(( ( '!=' / '==' ) _ comparison)*)    { return binaryNode(x, pairs);  }
comparison = x:term   _ pairs:(( ( '>' / '>=' / '<' / '<=' ) _ term)*)  { return binaryNode(x, pairs);  }
term       = x:factor _ pairs:(( ( '-' / '+' ) _ factor)*)              { return binaryNode(x, pairs);  }
factor     = x:unary  _ pairs:(( ( '/' / '*' ) _ unary)*)               { return binaryNode(x, pairs);  }
unary      = op:( '!' / '-' ) _ x:unary                                 { return unaryNode(op, x);      }
             / ifExpr
             / fnCall
             / primary

ifExpr     = 'if' _ '(' _ cond:expression _ ')' _ then:expression _else:((_ 'else' _ expression)?)
                                                                                     { return ifNode(cond, then, _else); }
fnCall     = f:primary _ '(' _ args:((expression (_ ',' _ expression)*)?) _ ')'      { return fnCallNode(f, args);       }

primary    = p:(NUMBER / STRING / BOOL / NULL / SYMBOL / block / grouping)
grouping   = '(' _ e:expression _ ')'                                                { return e;                         }
block      = '{' _ b:((_ exprStatement / letStatement _)*) _ '}'                     { return blockNode(b);              }

NUMBER      = n:([0-9]+ ('.' [0-9]+)?)                         { return numberNode(n); }
BOOL        = b:('true' / 'false')                             { return boolNode(b);   } 
NULL        = 'null'                                           { return nullNode;      }
STRING      = s:('"' (!'"' .)* '"')                            { return stringNode(s); }
SYMBOL      = s:(SYMBOLSTART (SYMBOLSTART / [0-9])*)           { return symbolNode(s); }
SYMBOLSTART = [a-zA-Z] / '$' / '_'

_  = __*
__ = [ \r\t\n]+
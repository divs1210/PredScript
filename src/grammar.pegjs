{
    const nullNode = {type: 'null', value: 'null'};

    function numberNode(parsed) {
        // console.log('parsed: '+JSON.stringify(parsed, null, 2));
        let ret = parseFloat(parsed.flat(2).join(''));
        // console.log('ret: '+ret);
        return {type: 'string', value: ret};
    }

    function boolNode(parsed) {
        let ret = parsed === 'true'? true : false;
        return {type: 'string', value: ret};
    }

    function stringNode(parsed) {
        let ret = parsed[1].map(x => x[1]).join('');
        return {type: 'string', value: ret};
    }

    function symbolNode(parsed) {
        let ret = parsed.flat(1).join('');
        return {type: 'symbol', value: ret};
    }
}

program   = (_ statement _)*

statement        = letStatement / multiFnStatement / exprStatement
exprStatement    = expression (_ ';')?
letStatement     = 'let' __ SYMBOL _ '=' _ expression (_ ';')?
multiFnStatement = 'function' __ SYMBOL _ '(' _ multiFnArgs? _ ')' _ block
multiFnArgs      = multiFnArg (_ ',' _ multiFnArg)*
multiFnArg       = SYMBOL _ ':' _ SYMBOL

expression = equality
equality   = comparison _ ( ( '!=' / '==' ) _ comparison)*
comparison = term _ ( ( '>' / '>=' / '<' / '<=' ) _ term)*
term       = factor _ ( ( '-' / '+' ) _ factor)*
factor     = unary _ ( ( '/' / '*' ) _ unary)*
unary      = ( '!' / '-' ) _ unary
             / ifExpr
             / fnCall
             / primary

ifExpr     = 'if' _ '(' _ expression _ ')' _ expression (_ 'else' _ expression)?
fnCall     = primary _ '(' _ (expression (_ ',' _ expression)*)? _ ')'

primary    = NUMBER / STRING / BOOL / NULL / SYMBOL / block / grouping
grouping   = '(' _ expression _ ')'
block      = '{' _ (_ exprStatement / letStatement _)* _ '}'

NUMBER      = n:([0-9]+ ('.' [0-9]+)?) { return numberNode(n); }
BOOL        = b:('true' / 'false') { return boolNode(b); } 
NULL        = 'null' { return nullNode; }
STRING      = s:('"' (!'"' .)* '"') { return stringNode(s); }
SYMBOL      = s:(SYMBOLSTART (SYMBOLSTART / [0-9])*) { return symbolNode(s); }
SYMBOLSTART = [a-zA-Z] / '$' / '_'

_  = __*
__ = [ \r\t\n]+
{
    function stringNode(parsed) {
        // console.log('parsed: '+JSON.stringify(parsed, null, 2));
        let ret = parsed[1].map(x => x[1]).join('');
        // console.log('ret: '+ret);
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

primary    = NUMBER / STRING / SYMBOL / BOOL / NULL / block / grouping
grouping   = '(' _ expression _ ')'
block      = '{' _ (_ exprStatement / letStatement _)* _ '}'

NUMBER      = [0-9]+ ('.' [0-9]+)?
BOOL        = 'true' / 'false'
NULL        = 'null'
STRING      = s:('"' (!'"' .)* '"') { return stringNode(s); }
SYMBOL      = s:(SYMBOLSTART (SYMBOLSTART / [0-9])*) { return symbolNode(s); }
SYMBOLSTART = [a-zA-Z] / '$' / '_'

_  = __*
__ = [ \r\t\n]+
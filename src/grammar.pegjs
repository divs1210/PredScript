program   = (_ statement _)*

statement        = exprStatement / letStatement / multiFnStatement
exprStatement    = expression _ ';'
letStatement     = 'let' __ SYMBOL _ '=' _ expression _ ';'
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
STRING      = '"' (!'"' .)* '"'
SYMBOL      = SYMBOLSTART (SYMBOLSTART / [0-9])*
SYMBOLSTART = [a-zA-Z] / '$' / '_'

_  = __*
__ = [ \r\t\n]+
program   = (_ statement _)*

statement = exprStatement / letStatement / multiFnStatement

exprStatement    = expression _ ';'

letStatement     = 'let' __ SYMBOL _ '=' _ expression _ ';'

multiFnStatement = 'function' __ SYMBOL _ '(' _ multiFnArgs? _ ')' _ multiFnBody
multiFnBody      = '{' _ (_ statement _)* _ '}'
multiFnArgs      = multiFnArg (_ ',' _ multiFnArg)*
multiFnArg       = SYMBOL _ ':' _ SYMBOL

expression = equality
equality   = comparison _ ( ( '!=' / '==' ) _ comparison)*
comparison = term _ ( ( '>' / '>=' / '<' / '<=' ) _ term)*
term       = factor _ ( ( '-' / '+' ) _ factor)*
factor     = unary _ ( ( '/' / '*' ) _ unary)*
unary      = ( '!' / '-' ) _ unary
             / primary
primary    = NUMBER / STRING / SYMBOL / BOOL / NULL / '(' _ expression _ ')'

NUMBER      = [0-9]+ ('.' [0-9]+)?
BOOL        = 'true' / 'false'
NULL        = 'null'
STRING      = '"' (!'"' .)* '"'
SYMBOL      = SYMBOLSTART (SYMBOLSTART / [0-9])*
SYMBOLSTART = [a-zA-Z] / '$' / '_'

_  = __*
__ = [ \r\t\n]+
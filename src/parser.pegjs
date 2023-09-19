start 
  = expr

expr
  = blockExpr
  / parenExpr
  / multiFnExpr
  / ifExpr
  / arithmeticExpr
  / logicExpr
  / fnCallExpr
  / number
  / symbol

blockExpr
  = "{" (space* expr space*)* "}"

parenExpr
  = "(" space* expr space* ")"

multiFnExpr
  = "function" space symbol space* typedFnExpr space* expr

ifExpr
  = "if" space* parenExpr space expr
  / "if" space* parenExpr space expr elseExpr

arithmeticExpr
  = "-" expr
  / mathable space* arithmeticOperator space* mathable

logicExpr
  = logicable space* logicOperator space* logicable

fnCallExpr
  = fnable space* parenExpr

number
  = decimal
  / integer

symbol
  = [a-zA-Z]+ [a-zA-Z0-9]


// util
// ====
logicable
  = symbol
  / fnCallExpr
  / parenExpr
  / blockExpr

fnable
  = symbol
  / parenExpr

mathable
  = symbol
  / number
  / parenExpr
  / fnCallExpr
  / ifExpr
  / blockExpr

integer
  = [0-9]+

decimal
  = integer "." integer

arithmeticOperator
  = "+"
  / "-"
  / "*"
  / "/"

logicOperator
  = "<"
  / "<="
  / ">"
  / ">="
  / "=="
  / "and"
  / "or"

elseExpr
  = "else" space expr
  / "else" space ifExpr

typedFnExpr
  = "(" space* (typedVarExpr space* "," space*)* ")" space* typeExpr

typedVarExpr
  = symbol space* typeExpr

typeExpr
  = ":" space* symbol

space
  = [ \t\r\n]+
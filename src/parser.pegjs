{
  const { 
    makeNumber, makeSymbol 
  } = options;
}

start 
  = expr

expr
  = x:number { return makeNumber(x) }
  / s:symbol { return makeSymbol(s) }

number
  = decimal  
  / integer

symbol
  = arr:([a-zA-Z]+ [a-zA-Z0-9]*)


// util
// ====
integer
  = arr:[0-9]+

decimal
  = integer "." integer

space
  = [ \t\r\n]+
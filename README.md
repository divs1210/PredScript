[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](https://opensource.org/licenses/MIT) ![tests](https://github.com/divs1210/PredScript/actions/workflows/node.js.yml/badge.svg)

# PredScript

Predicates as Types. Compiles to JS.

**!!WIP!!**


## Demo

```typescript
// define new predicate isEven
function isEven(x: isInt): isBool {
    x % 2 == 0
}

// define new predicate isOdd
function isOdd(x: isInt): isBool {
    !isEven(x)
}

// use these predicates as normal functions
isEven(5) // => false: isBool
isOdd(3)  // =>  true: isBool


// now consider a simple function
function inc(x: isInt): isInt {
    x + 1
}

inc(4) // => 5: isInt

// this can be overridden for our new predicates!
function inc(x: isEven): isOdd {
    // `as!` forces type conversion without checking
    let incX: isInt = as!(isInt, x) + 1;
    as!(isOdd, incX);
}

function inc(x: isOdd): isEven {
    let incX: isInt = as!(isInt, x) + 1;
    as!(isEven, incX);
}

// `as` does a checked conversion at runtime
let e: isEven = as(isEven, 2);
inc(e) // => 3: isOdd 
inc(as(isOdd, 11)) // => 12: isEven 
```

## Real world use case

```typescript
// this is type checked at compile time
async function fetchUserById(id: isInt): isUser {
    let url: isURL = fetchUserByIdURLTemplate(id);
    let resp: isHTTPResp = await fetch(url);
    let userMap: isMap = parseJSON(resp.body);
    
    // this is validated and cast at runtime
    as(isUser, userMap);
}
```

## License

MIT License

(C) Divyansh Prakash
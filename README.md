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
    x
    .as!(asInt, this) // forced type cast
    .inc(this)
    .as!(isOdd, this) // forced type cast
}

function inc(x: isOdd): isEven {
    x
    .as!(asInt, this)
    .inc(this)
    .as!(isEven, this)
}

// `as` does a checked conversion at runtime
let e: isEven = as(isEven, 2);
inc(e) // => 3: isOdd 
inc(as(isOdd, 11)) // => 12: isEven 
```

## Real world use case

```typescript
let isUser: isPred =
    mapOf({
        id:    isPosInt,
        name:  isString,
        email: isEmailString,
        dob:   isPastDateString
    })

// this is type checked at compile time
async function fetchUserById(id: isInt): isUser {
    id
    .fetchUserByIdURLTemplate(this)
    .fetch(this)
    .await(this)
    .get(this, "body")
    .parseJSON(this)
    .as(isUser, this) // validate and cast at runtime 
}

// no validation library required!
fetchUserById(5).await(this);
// => { 
//  id: 5,
//  name: "Bob",
//  email: "bob@jimale.com", 
//  dob: "1991-02-23" 
// }
```

## Usage

```shell
$ git clone https://github.com/divs1210/PredScript
...
$ cd PredScript
$ npm i
...
$ node compile.js examples/poly.ps
Compiled code in: ./out.js
$ node out.js
true -5
```

## License

MIT License

(C) Divyansh Prakash
[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](https://opensource.org/licenses/MIT) ![tests](https://github.com/divs1210/PredScript/actions/workflows/node.js.yml/badge.svg)

# PredScript

Predicates as Types.

Statically and dynamically checked.

Compiled to JS.

**!! BEWARE: WIP !!**


## Use Case

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

## Design goals

- Types can be arbitrary predicates (like `isEmailString` and `isPosInt`)
- Statically type check as much as possible at compile time
- Dynamically type check at runtime
  - do it efficiently
  - runtime can be directed to skip arbitrary checks (for optimization)
- Polymorphic
- Compile to JS
- Look and feel similar to JS

## Usage

### Install

```shell
$ git clone https://github.com/divs1210/PredScript
$ cd PredScript
$ npm i
```

### Compile and run [examples](/examples)

```shell
$ node compile.js examples/poly.ps
$ node dist/index.js
```

## License

MIT License

(C) Divyansh Prakash, 2023

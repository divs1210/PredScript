[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](https://opensource.org/licenses/MIT) ![tests](https://github.com/divs1210/PredScript/actions/workflows/node.js.yml/badge.svg)

# PredScript

## What

PredScript is a typed functional programming language that uses predicates as types.

### Features

- [functional and data driven language](/examples/collections.ps)
- [functions are polymorphic and dispatch on types of all arguments](/examples/map.ps)
- [types are arbitrary functions that return booleans](/examples/poly.ps)
- [types can have subtypes](/examples/hierarchy.ps)

**!! BEWARE: WIP !!**

## Why

No matter how awesome your static type checker is -
whether you use [TypeScript](https://www.typescriptlang.org/),
or meticulously prove each line with [Agda](https://agda.github.io/agda/),
chances are that you are going to have to
[validate some data](https://blog.logrocket.com/dynamic-type-validation-in-typescript/) that originates from outside your process.

At that point, static type checkers are not available,
and there has to be some different validation strategy -
leading to a dynamic type checker, and a different type system
for describing dynamic types. (`EmailString`, `PosInt`)

What if a language's type system was built around
validators that could be checked efficiently at runtime,
and to some extent at compile time?

That's the question PredScript wants to answer.

## Use Case

```typescript
// this can be type checked at compile time
async function fetchUserById(id: isInt): isUser {
    (baseURL + "/users/" + id)
    .fetch
    .await
    .get($this, "body")
    .parseJSON
    // validate and cast at runtime 
    .as(isUser, $this)
}

fetchUserById(5).then($this, println);
```

## Design goals

- Types can be arbitrary predicates (like `isEmailString` and `isPosInt`)
- Be amenable to static type checking / type linting
- Dynamically type check at runtime
  - do it efficiently
  - runtime can be directed to skip arbitrary checks (for optimization)
- Polymorphic
- Compile to JS
- Interop with JS
- Look and feel similar to JS

## Usage

### Install

```shell
$ git clone https://github.com/divs1210/PredScript
$ cd PredScript
$ npm i
```

### Compile and run [examples](/examples/poly.ps)

```shell
$ node compile.js examples/poly.ps
$ node dist/index.js
```

## License

MIT License

(C) Divyansh Prakash, 2023

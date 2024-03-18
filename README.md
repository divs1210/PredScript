[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](https://opensource.org/licenses/MIT) ![tests](https://github.com/divs1210/PredScript/actions/workflows/node.js.yml/badge.svg)

# PredScript

## What

PredScript is a functional programming language with first-class types.

### Features

- [functional and data driven language](/examples/collections.ps)
- [functions are polymorphic and dispatch on types of all arguments](/examples/math.ps)
- [types are arbitrary functions that return booleans (predicates)](/examples/poly.ps)
- [types can have subtypes](/examples/hierarchy.ps)

**!! BEWARE: WIP !!**

## Why

If a language's type system was built around predicates -
abitrary functions of one argument that return booleans - 
we could define types like `isPositiveInt`, `isEmailString` etc.

In the statically typed world, these kind of types are called [dependent types](https://en.wikipedia.org/wiki/Dependent_type).
Dependently typed languages like [Agda](https://github.com/agda/agda), [Idris](https://github.com/idris-lang/Idris2), etc.
often involve writing a lot of proofs which makes them not very well
suited for general purpose programming.

PredScript is an attempt to make a flexible dependently-typed functional language
with familiar (easy / mainstream / JS-like) syntax that lies
somewhere on the spectrum of `Dynamically Typed → Statically Typed`.

## Code Example

```typescript
interface isEmailString extends isString;
function isEmailString(s: isString): isBool {
    /^\S+@\S+\.\S+$/
    .test($this, s)
}

let isUser: isPred = gen_isRecord({ 
    "id": isInt,
    "username": isString,
    "email": isEmailString
});

let u: isUser = as(isUser, {
    "id": 1,
    "username": "johndoe",
    "email": "johndoe@email.com"
});
```

## Design goals

- Types can be arbitrary predicates (like `isEmailString` and `isPositiveInt`)
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

PredScript is developed against `node 20.6.1`.
Use [nvm](https://github.com/nvm-sh/nvm) to install it.

```shell
$ nvm install 20.6.1
$ nvm use 20.6.1
```

Download and install PredScript

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

### Run tests

```shell
$ npm test
```

## License

[MIT License](/LICENSE)

(C) Divyansh Prakash, 2023-2024

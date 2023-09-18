const assert = require('node:assert/strict');
const { List, Map, is } = require('immutable');
const {parse} = require('../src/parser.js');

let code = `{
    function fact(n: isReal): isReal {
        if (n < 2)
            1
        else
            n * fact(n - 1)
    }

    fact(5)
}`;

assert(is(
    parse(code),
    Map({
        type: 'do',
        children: List([
            // function definition
            Map({
                type: 'function',
                name: 'fact',
                args: List([
                    Map({
                        type: 'symbol',
                        val: 'n'
                    })
                ]),
                argTypes: List([
                    Map({
                        type: 'symbol',
                        val: 'isReal'
                    })
                ]),
                retType: Map({
                    type: 'symbol',
                    val: 'isReal'
                }),
                body: Map({
                    type: 'if',
                    cond: Map({
                        type: '<',
                        left:  Map({
                            type: 'symbol',
                            val: 'n'
                        }),
                        right: Map({
                            type: 'number',
                            val: 2
                        })
                    }),
                    then: Map({
                        type: 'number',
                        val: 1
                    }),
                    else: Map({
                        type: '*',
                        left: Map({
                            type: 'symbol',
                            val: 'n'
                        }),
                        right: Map({
                            type: 'apply',
                            f: Map({
                                type: 'symbol',
                                val: 'fact'
                            }),
                            args: List([
                                Map({
                                    type: '-',
                                    left: Map({
                                        type: 'symbol',
                                        val: 'n'
                                    }),
                                    right: Map({
                                        type: 'number',
                                        val: 1
                                    })
                                })
                            ])
                        })
                    })
                })
            }),
            // function call
            Map({
                type: 'apply',
                f: Map({
                    type: 'symbol',
                    val: 'fact'
                }),
                args: List([
                    Map({
                        type: 'number',
                        val: 5
                    })
                ])
            })
        ])
    })
));
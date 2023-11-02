class Recur {
    constructor(x) {
        this.x = x;
    }
}

function recur(x) {
    return new Recur(x);
}

function loop(init, f) {
    let res = f(init);
    
    while(res instanceof Recur) {
        res = f(res.x);
    }

    return res;
}

/* example:
===========
let fact5 = loop({ n: 5, f: 1}, ({ n, f }) => {
    if (n < 2)
        return f;
    return recur({ 
        n: n - 1, 
        f: f * n 
    });
});
*/

module.exports = {
    loop,
    recur
};
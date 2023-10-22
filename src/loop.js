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

module.exports = {
    loop,
    recur
};
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
    
    if (res instanceof Recur)
        return loop(res.x, f);

    return res;
}

module.exports = {
    loop,
    recur
};
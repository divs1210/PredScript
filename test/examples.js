const fs = require('fs');
const { exec: _exec } = require("child_process");

function exec(cmd) {
    return new Promise(resolve => {
        _exec(cmd, (err, stdout, stderr) => resolve([err, stdout, stderr]));
    });
}

async function runFile(fileName) {
    console.log(`Running: ${fileName}`);

    // compile file
    var [err, stdout, stderr] = await exec(`node compile examples/${fileName} f`);
    if (err || stderr)
        throw new Error(err?.message || stderr);

    // run file
    var [err, stdout, stderr] = await exec(`node dist/index.temp.js`);
    if(err || stderr)
        throw new Error(err?.message || stderr);
    else if(stdout)
        console.log(stdout);
}

async function runAll() {
    let files = fs.readdirSync('./examples/');

    for (let file of files)
        await runFile(file);
}

runAll();
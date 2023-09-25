const path = require('node:path'); 
const fs = require('fs');
const { compile } = require('./src/compiler');
const { exec } = require("child_process");

let [_, __, fileName] = process.argv;
let filePath = path.join(__dirname, fileName);
let code = fs.readFileSync(filePath, 'utf8');
let compiledCode = compile(code);

exec('npm i @vercel/ncc -g', (nccErr, nccStdout, nccStderr) => {
    if (nccErr)
        console.log(`error: ${error.message}`);
    else if (nccStderr)
        console.log(`stderr: ${stderr}`);
    else {
        exec('mkdir -p dist', (dirError, dirStdout, dirStderr) => {
            if (dirError)
                console.error('Could not creats ./dist directory!');
            else {
                fs.writeFile('./dist/index.temp.js', compiledCode, (err) => {
                    if(err)
                        console.error(err);
                    else {
                        console.log("Intermediate output in: ./dist/index.temp.js");
                
                        exec("ncc build ./dist/index.temp.js -o dist", (error, stdout, stderr) => {
                            if (error)
                                console.error(`error: ${error.message}`);
                            else if (stderr)
                                console.error(`stderr: ${stderr}`);
                            else
                                console.log(`stdout: ${stdout}`);
                        });
                    }
                });
            }
        });
    }
});
#!/usr/bin/env node

const path = require('node:path'); 
const fs = require('fs');
const { compile } = require('./src/compiler');
const { exec } = require("child_process");

let [_, __, fileName] = process.argv;

let code = fs.readFileSync(fileName, 'utf8');
let compiledCode = compile(code);
let intermediateFile = path.join(__dirname, 'dist', 'index.temp.js');

exec('npm i @vercel/ncc -g', (nccErr, nccStdout, nccStderr) => {
    if (nccErr)
        console.error(nccErr.message);
    else if (nccStderr)
        console.error(nccStderr);
    else {
        exec('mkdir -p dist', (dirError, dirStdout, dirStderr) => {
            if (dirError || dirStderr)
                console.error('Could not create ./dist directory!');
            else {
                fs.writeFile(intermediateFile, compiledCode, (err) => {
                    if(err)
                        console.error(err);
                    else {
                        console.log(`Intermediate output in: ${intermediateFile}`);
                
                        exec(`ncc build ${intermediateFile} -o ${__dirname}/dist`, (error, stdout, stderr) => {
                            if (error)
                                console.error(error.message);
                            else if (stderr)
                                console.error(stderr);
                            else
                                console.log(stdout);
                        });
                    }
                });
            }
        });
    }
});
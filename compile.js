#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { compile } = require('./src/compiler');
const { exec } = require("child_process");

let [_, __, fileName] = process.argv;
let code = fs.readFileSync(fileName, 'utf8');
let compiledCode = compile(code);

let wpConfigFile = path.join(__dirname, './webpack.config.js')


exec('npm i webpack webpack-cli -g', (wpErr, wpStdout, wpStderr) => {
    if (wpErr)
        console.error(wpErr.message);
    else if (wpStderr)
        console.error(wpStderr);
    else {
        exec('mkdir -p dist', (dirError, dirStdout, dirStderr) => {
            if (dirError || dirStderr)
                console.error('Could not create ./dist directory!');
            else {
                fs.writeFile('dist/index.temp.js', compiledCode, (err) => {
                    if(err)
                        console.error(err);
                    else {
                        console.log('Intermediate output in: dist/index.temp.js');
                
                        exec(`webpack-cli b ./dist/index.temp.js -c ${wpConfigFile} -o ./dist`, (error, stdout, stderr) => {
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
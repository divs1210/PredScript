const path = require('node:path'); 
const fs = require('fs');
const { compile } = require('./src/compiler');
const { exec } = require("child_process");

let [_, __, fileName] = process.argv;
let filePath = path.join(__dirname, fileName);
let code = fs.readFileSync(filePath, 'utf8');
let compiledCode = compile(code);

exec('mkdir -p dist', () => {
    fs.writeFile('./dist/index.temp.js', compiledCode, (err) => {
        if(err)
            console.error(err);
        else {
            console.log("Intermediate output in: ./dist/index.temp.js");
    
            exec("ncc build ./dist/index.temp.js -o dist", (error, stdout, stderr) => {
                if (error)
                    console.log(`error: ${error.message}`);
                else if (stderr)
                    console.log(`stderr: ${stderr}`);
                else
                    console.log(`stdout: ${stdout}`);
            });
        }
    });
});
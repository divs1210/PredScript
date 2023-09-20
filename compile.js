const path = require('node:path'); 
const fs = require('fs');
const { compile } = require('./src/compiler');

let [_, __, fileName] = process.argv;
let filePath = path.join(__dirname, fileName);
let code = fs.readFileSync(filePath, 'utf8');
let compiledCode = compile(code);

fs.writeFile('out.js', compiledCode, (err) => {
    if(err)
        console.error(err);
    else
        console.log("Compiled code in: ./out.js");
});
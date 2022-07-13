// This is kind of hacky, but it allows us to bundle the .env variables
// into the electron builds without using webpack.
// webpack was making the build process incredibly slow.

// Copy all the .env variables to a temp file called env.ts
// After compilation, delete env.ts
const fs = require('fs');
const env = fs.readFileSync('../.env', 'utf8');
const variables = env.split('\n');
let ts = 'export const ENV = {\n';
variables.forEach(variable => {
	const [key, value] = variable.split('=');
	ts += `\t${key}: '${value}',\n`;
});
ts += `};`;
fs.writeFileSync('src/env.ts', ts);
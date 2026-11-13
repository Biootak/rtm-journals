const fs = require('fs');
const f = '_build/expert/build-html-anchors.js';
let s = fs.readFileSync(f, 'utf8');
// repair literal-newline damage from the previous patch
s = s.replace(/body\.find\('br'\)\.replaceWith\('\n'\);/, "body.find('br').replaceWith('\\n');");
s = s.replace(/\$\(n\)\.append\('\n'\);/, "$(n).append('\\n');");
// sentinel + regex must use explicit \u0001 escapes
s = s.replace(/\$\(img\)\.replaceWith\('[^']*' \+ k \+ '[^']*'\);/, "$(img).replaceWith('\\u0001' + k + '\\u0001');");
s = s.replace(/const re = \/[^/]*\(\\d\+\)[^/]*\/g;/, 'const re = /\\u0001(\\d+)\\u0001/g;');
fs.writeFileSync(f, s);
console.log('done');

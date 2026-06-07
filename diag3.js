const fs = require('fs');
let code = fs.readFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', 'utf8');

let lines = code.split('\n');
let depth = 0;
let started = false;

for(let i=0; i<lines.length; i++) {
  let line = lines[i];
  
  if (i === 645) { // {result && (
    started = true;
  }
  
  if (!started) continue;
  
  // Very simplistic tag count (assuming properly formatted JSX)
  // We'll count `<div` and `</div`
  let opens = (line.match(/<div(\s|>)/g) || []).length;
  let closes = (line.match(/<\/div>/g) || []).length;
  
  depth += opens;
  depth -= closes;
  
  if (depth === 0 && closes > 0) {
    console.log(`Line ${i}: depth reached 0! Line content: ${line.trim()}`);
  } else if (depth < 0) {
    console.log(`Line ${i}: depth is negative (${depth})! Line content: ${line.trim()}`);
  }
  
  if (line.includes('Bottom: Timeline')) {
    console.log(`Line ${i}: Timeline starts, depth = ${depth}`);
  }
  
  if (i > 1690 && i < 1700) {
    console.log(`Line ${i}: depth = ${depth}, content: ${line.trim()}`);
  }
}

const fs = require('fs');
let code = fs.readFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', 'utf8');

let lines = code.split('\n');
let depth = 0;
for(let i=645; i<1700; i++) { // From {result && ( to the end of result-section
  let line = lines[i];
  let opens = (line.match(/<div/g) || []).length;
  let closes = (line.match(/<\/div>/g) || []).length;
  depth += opens;
  depth -= closes;
  if(line.includes('result && (')) {
    console.log(`Line ${i}: Start result section (Depth: ${depth})`);
  }
  if(line.includes('RIGHT COLUMN')) {
    console.log(`Line ${i}: ${line.trim()} (Depth: ${depth})`);
  }
  if(line.includes('Bottom: Timeline')) {
    console.log(`Line ${i}: ${line.trim()} (Depth: ${depth})`);
  }
  if(line.includes('Render button')) {
    console.log(`Line ${i}: ${line.trim()} (Depth: ${depth})`);
  }
  if (depth === 0 && i > 650 && i < 1700) {
    console.log(`Line ${i}: Reached depth 0 => ${line.trim()}`);
  }
}
console.log('Final depth around 1700:', depth);

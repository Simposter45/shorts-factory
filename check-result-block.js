const fs = require('fs');
const content = fs.readFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', 'utf8');

const lines = content.split('\n');

let openDivs = 0;
let stack = [];

// lines array is 0-indexed. 644 is index 643.
for (let i = 643; i <= 1922; i++) { // up to 1923, which is `)}`
  const line = lines[i];
  if (!line || line.trim().startsWith('//') || (line.includes('{/*') && line.includes('*/}'))) continue;

  const opens = (line.match(/<div/g) || []).length;
  const closes = (line.match(/<\/div/g) || []).length;

  for(let j = 0; j < opens; j++) {
     stack.push(i + 1);
  }
  for(let j = 0; j < closes; j++) {
     if(stack.length > 0) stack.pop();
  }
}
console.log(`Unclosed divs inside result block: ${stack.join(', ')}`);

const fs = require('fs');
const content = fs.readFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', 'utf8');

const lines = content.split('\n');
let stack = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim().startsWith('//') || (line.includes('{/*') && line.includes('*/}'))) continue;

  const opens = (line.match(/<div/g) || []).length;
  const closes = (line.match(/<\/div/g) || []).length;

  for(let j = 0; j < opens; j++) {
     stack.push(i + 1);
  }
  for(let j = 0; j < closes; j++) {
     if(stack.length > 0) stack.pop();
  }
}
console.log(`Unclosed divs at end of file: ${stack.join(', ')}`);

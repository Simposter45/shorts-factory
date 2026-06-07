const fs = require('fs');
const lines = fs.readFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', 'utf8').split('\n');

let openDivs = 0;
for (let i = 642; i >= 517; i--) {
  if (lines[i].includes('</div')) openDivs -= (lines[i].match(/<\/div/g) || []).length;
  if (lines[i].includes('<div')) openDivs += (lines[i].match(/<div/g) || []).length;
  
  if (openDivs === 0 && i !== 642) {
    console.log('Matching opening div for line 642 found at line:', i + 1, lines[i]);
    break;
  }
}

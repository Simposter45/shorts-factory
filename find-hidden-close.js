const fs = require('fs');
const lines = fs.readFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', 'utf8').split('\n');

let openDivs = 0;
let started = false;
for (let i = 517; i < lines.length; i++) {
  if (lines[i].includes('display: result ? \'none\' : \'block\'')) {
    started = true;
  }
  if (!started) continue;
  
  if (lines[i].includes('<div')) openDivs += (lines[i].match(/<div/g) || []).length;
  if (lines[i].includes('</div')) openDivs -= (lines[i].match(/<\/div/g) || []).length;
  
  if (openDivs === 0 && started) {
    console.log('Closing div found at line:', i + 1);
    break;
  }
}

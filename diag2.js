const fs = require('fs');
let lines = fs.readFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', 'utf8').split('\n');

for(let i=1453; i<=1462; i++) {
  console.log(`Line ${i}:`, JSON.stringify(lines[i]));
}

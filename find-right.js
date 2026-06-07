const fs = require('fs');
const lines = fs.readFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', 'utf8').split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Right Inspector')) {
    console.log(i + 1, lines[i].trim());
    console.log(i + 2, lines[i+1].trim());
  }
}

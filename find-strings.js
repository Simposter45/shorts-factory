const fs = require('fs');
const lines = fs.readFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', 'utf8').split('\n');
for (let i=0; i<lines.length; i++) {
  if (lines[i].includes("'<div") || lines[i].includes('"<div') || lines[i].includes("</div'") || lines[i].includes('</div"')) {
    console.log(i+1, lines[i]);
  }
}

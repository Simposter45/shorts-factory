const fs = require('fs');
const lines = fs.readFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', 'utf8').split('\n');
const start = lines.findIndex(l => l.includes('function getSceneTimings') || l.includes('const getSceneTimings'));
if (start !== -1) {
  for(let i=start; i<start+15; i++) console.log(lines[i]);
} else {
  console.log("Not found");
}

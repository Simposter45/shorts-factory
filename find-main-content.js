const fs = require('fs');
const lines = fs.readFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (l.includes('main-content') || l.includes('result-section')) console.log(i + 1, l.trim());
});

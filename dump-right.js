const fs = require('fs');
const lines = fs.readFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', 'utf8').split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<div') && (lines[i].includes('className') || lines[i].includes('style'))) {
    if (!lines[i].includes('key=') && !lines[i].includes('map(')) {
      // console.log(i + 1, lines[i].trim());
    }
  }
}
// Just show lines 850 to 1100 to see the right inspector structure
lines.slice(850, 1100).forEach((l, i) => console.log(851 + i, l));

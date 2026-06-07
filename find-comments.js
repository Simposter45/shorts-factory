const fs = require('fs');
const content = fs.readFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', 'utf8');
const matches = content.match(/\{\/\*[\s\S]*?\*\/\}/g);
if (matches) {
  for (const m of matches) {
    if (m.includes('\n')) {
      console.log("Multiline comment found:", m);
    }
  }
} else {
  console.log("No comments found");
}

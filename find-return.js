const fs = require('fs');
const lines = fs.readFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', 'utf8').split('\n');
for(let i=380; i<=400; i++) console.log(i + ": " + lines[i]);

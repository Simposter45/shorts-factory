const fs = require('fs');
let code = fs.readFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', 'utf8');

code = code.replace(/prev\.wordTimings\.map/g, '(prev.wordTimings || []).map');

fs.writeFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', code);
console.log('Fixed prev.wordTimings');

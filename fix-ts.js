const fs = require('fs');
let code = fs.readFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', 'utf8');

code = code.replace(/prev\.wordTimings\.length/g, 'prev.wordTimings!.length');
code = code.replace(/prev\.wordTimings\[/g, 'prev.wordTimings![');

fs.writeFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', code);
console.log('Fixed prev.wordTimings TS error');

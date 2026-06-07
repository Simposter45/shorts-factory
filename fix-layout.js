const fs = require('fs');
let lines = fs.readFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', 'utf8').split('\n');

// 1. Change Input Sidebar width to 350px
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('className="input-sidebar"')) {
    lines[i] = lines[i].replace('width: \'400px\'', 'width: \'350px\'');
  }
}

// 2. Change Right Inspector width to 380px to prevent overflow
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('width: \'450px\'') && lines[i].includes('flexDirection: \'column\'')) {
    lines[i] = lines[i].replace('width: \'450px\'', 'width: \'380px\'');
  }
}

// 3. Change Video Player to 16:9 and remove phone styling
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('aspectRatio: \'9/16\'')) {
    lines[i] = lines[i].replace('aspectRatio: \'9/16\'', 'aspectRatio: \'16/9\'')
                       .replace('maxWidth: \'400px\'', 'maxWidth: \'600px\'')
                       .replace('borderRadius: \'24px\'', 'borderRadius: \'8px\'')
                       .replace('border: \'12px solid #1e293b\'', 'border: \'1px solid #334155\'');
  }
}

fs.writeFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', lines.join('\n'));
console.log('Layout updated to 16:9 and responsive widths');

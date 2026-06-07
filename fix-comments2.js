const fs = require('fs');
let code = fs.readFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', 'utf8');

// Remove these patterns at start of line (bare JSX comments outside of JSX context)
code = code.replace(/^\s*\{\/\* Bottom: Timeline \*\/\}\s*$/gm, '');
code = code.replace(/^\s*\{\/\* Render button \*\/\}\s*$/gm, '');
code = code.replace(/^\s*\{\/\* end result-section \*\/\}\s*$/gm, '');
code = code.replace(/^\s*\{\/\* end timeline \*\/\}\s*$/gm, '');
code = code.replace(/^\s*\{\/\* end right panel \*\/\}\s*$/gm, '');
code = code.replace(/^\s*\{\/\* end main flex row \*\/\}\s*$/gm, '');

// Also remove weird extra closing div with tons of spaces (line 1668)
code = code.replace(/^\s{28,}<\/div>\s*$/gm, '');

fs.writeFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', code);
console.log('Fixed bare JSX comments');

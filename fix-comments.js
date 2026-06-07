const fs = require('fs');
let code = fs.readFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', 'utf8');

// Remove inline JSX comments on closing div lines that cause parse errors
code = code.replace(/\}\s*\{\/\* end right panel \*\/\}/g, '}');
code = code.replace(/\}\s*\{\/\* end main flex row \*\/\}/g, '}');
code = code.replace(/\}\s*\{\/\* end timeline \*\/\}/g, '}');
code = code.replace(/\}\s*\{\/\* end result-section \*\/\}/g, '}');

// Also clean up any trailing whitespace issues like div> {/* comment */}
code = code.replace(/<\/div>\s*\{\/\*[^*]*\*\/\}/g, '</div>');

fs.writeFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', code);
console.log('Fixed JSX comments');

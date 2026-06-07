const fs = require('fs');
const { parse } = require('@babel/parser');

const code = fs.readFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', 'utf8');

try {
  parse(code, {
    sourceType: 'module',
    plugins: ['jsx', ['typescript', { isTSX: true }]]
  });
  console.log("Parse successful!");
} catch (e) {
  console.log("Parse Error:", e.message, "at line", e.loc?.line, "column", e.loc?.column);
}

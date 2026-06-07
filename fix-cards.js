const fs = require('fs');
let code = fs.readFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', 'utf8');

code = code.replace(
  /<div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '20px', maxHeight: '400px', overflowY: 'auto', marginTop: '24px' }}>/g,
  '<div style={{ background: \'#1e293b\', border: \'1px solid #334155\', borderRadius: \'12px\', padding: \'20px\', maxHeight: \'400px\', overflowY: \'auto\', marginTop: \'0\', color: \'white\' }}>'
);

code = code.replace(
  /<h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px' }}>Voiceover Subtitles<\/h3>/g,
  '<h3 style={{ marginTop: 0, marginBottom: \'16px\', fontSize: \'18px\', color: \'white\' }}>Voiceover Subtitles</h3>'
);

fs.writeFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', code);
console.log('Fixed card backgrounds');

const fs = require('fs');
let lines = fs.readFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', 'utf8').split('\n');

// 1. Change layout to Split Pane (Row)
const containerIdx = lines.findIndex(l => l.includes('<div className="container" style={result ? {'));
if (containerIdx !== -1) {
  lines[containerIdx] = `    <div className="container" style={result ? { maxWidth: '100%', margin: 0, padding: 0, height: '100vh', display: 'flex', flexDirection: 'row', background: '#0f172a', color: 'white', overflow: 'hidden' } : {}}>`;
}

// 2. Modify the Input Section wrapper
const inputWrapperIdx = lines.findIndex(l => l.includes('<div style={{ display: result ? \'none\' : \'block\' }}>'));
if (inputWrapperIdx !== -1) {
  lines[inputWrapperIdx] = `      <div className="input-sidebar" style={result ? { width: '400px', height: '100vh', overflowY: 'auto', background: '#f8f9fa', padding: '24px', flexShrink: 0, color: '#333' } : {}}>`;
}

// 3. Right Inspector & Textareas fix flexShrink
// Find Right Inspector: <div style={{ width: '450px', display: 'flex', flexDirection: 'column', gap: '16px', flexShrink: 0, paddingLeft: '16px', overflowY: 'auto' }}>
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('width: \'450px\'') && lines[i].includes('flexDirection: \'column\'')) {
    if (!lines[i].includes('flexShrink: 0')) {
       lines[i] = lines[i].replace('flexDirection: \'column\',', 'flexDirection: \'column\', flexShrink: 0,');
    }
  }
  // Add flexShrink: 0 to subtitle divs
  if (lines[i].includes('key={sub.id} style={{ display: \'flex\', gap: \'8px\'')) {
     lines[i] = lines[i].replace('marginBottom: \'8px\'', 'marginBottom: \'8px\', flexShrink: 0');
  }
  // Make 9:16 video player look like a phone
  if (lines[i].includes('aspectRatio: \'9/16\'') && lines[i].includes('backgroundColor: \'#000\'')) {
     lines[i] = lines[i].replace('borderRadius: \'12px\'', 'borderRadius: \'24px\', border: \'12px solid #1e293b\'');
  }
}

// 4. Remove `minHeight: 0` from Voiceover subtitle container if needed?
// Right now voiceover container is inside Right Inspector.
// `<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>`
// If it has gap 12px, it's fine.

fs.writeFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', lines.join('\n'));
console.log('Split layout applied');

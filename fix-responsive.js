const fs = require('fs');
let code = fs.readFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', 'utf8');

// 1. Remove minWidth: 900px
code = code.replace(/minWidth: '900px'/g, 'minWidth: 0');

// 2. Change Left Player and Right Inspector container to flexWrap: wrap
code = code.replace(
  /<div style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0 }}>/,
  '<div style={{ display: \'flex\', gap: \'24px\', flexWrap: \'wrap\', flex: 1, minHeight: 0, overflowY: \'auto\' }}>'
);

// 3. Make Video Player 9:16
code = code.replace(/aspectRatio: '16\/9'/g, 'aspectRatio: \'9/16\'');
code = code.replace(/maxWidth: '600px'/g, 'maxWidth: \'320px\'');
code = code.replace(/borderRadius: '8px', border: '1px solid #334155'/g, 'borderRadius: \'24px\', border: \'12px solid #1e293b\'');

// 4. Update Right Inspector styling to allow wrapping and look like a list of cards
// Right Inspector starts with: <div style={{ width: '380px', display: 'flex', flexDirection: 'column', flexShrink: 0, gap: '24px', overflowY: 'auto', padding: '16px', background: '#020617', borderLeft: '1px solid #1e293b' }}>
code = code.replace(
  /<div style={{ width: '380px', display: 'flex', flexDirection: 'column', flexShrink: 0, gap: '24px', overflowY: 'auto', padding: '16px', background: '#020617', borderLeft: '1px solid #1e293b' }}>/,
  '<div style={{ flex: \'1 1 380px\', minWidth: \'350px\', display: \'flex\', flexDirection: \'column\', gap: \'16px\', overflowY: \'visible\', padding: \'0 16px 16px 16px\' }}>'
);

// 5. Ensure "Clip Adjustments" (the container holding Scene Editor) is a card
code = code.replace(
  /<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>\s*<h3 style={{ margin: 0, fontSize: '18px' }}>Clip Adjustments/g,
  '<div style={{ background: \'#1e293b\', padding: \'20px\', borderRadius: \'12px\', border: \'1px solid #334155\' }}>\n<div style={{ display: \'flex\', justifyContent: \'space-between\', alignItems: \'center\' }}>\n<h3 style={{ margin: 0, fontSize: \'18px\', color: \'white\' }}>Clip Adjustments'
);

// Close the Clip Adjustments div... wait, it's safer to just wrap Audio Settings and Character Settings.
// Audio Settings is already a card: <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '20px' }}>
code = code.replace(
  /<div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '20px' }}>/g,
  '<div style={{ background: \'#1e293b\', border: \'1px solid #334155\', borderRadius: \'12px\', padding: \'20px\', color: \'white\' }}>'
);

code = code.replace(
  /<div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '20px', marginTop: '24px' }}>/g,
  '<div style={{ background: \'#1e293b\', border: \'1px solid #334155\', borderRadius: \'12px\', padding: \'20px\', color: \'white\', marginTop: \'0\' }}>'
);

// Make text white in Audio Settings headers
code = code.replace(/<label style={{ fontSize: '14px', fontWeight: 600, display: 'block' }}>Voiceover Track \(Required\)<\/label>/g, '<label style={{ fontSize: \'14px\', fontWeight: 600, display: \'block\', color: \'white\' }}>Voiceover Track (Required)</label>');
code = code.replace(/<label style={{ fontSize: '14px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Background Music \(Optional\)<\/label>/g, '<label style={{ fontSize: \'14px\', fontWeight: 600, display: \'block\', marginBottom: \'8px\', color: \'white\' }}>Background Music (Optional)</label>');
code = code.replace(/<label style={{ fontSize: '14px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Avatar Persona<\/label>/g, '<label style={{ fontSize: \'14px\', fontWeight: 600, display: \'block\', marginBottom: \'8px\', color: \'white\' }}>Avatar Persona</label>');
code = code.replace(/<h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px' }}>Audio Settings<\/h3>/g, '<h3 style={{ marginTop: 0, marginBottom: \'16px\', fontSize: \'18px\', color: \'white\' }}>Audio Settings</h3>');
code = code.replace(/<h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px' }}>Character & Persona Settings<\/h3>/g, '<h3 style={{ marginTop: 0, marginBottom: \'16px\', fontSize: \'18px\', color: \'white\' }}>Character & Persona Settings</h3>');

// Fix textareas in Right Inspector to not have white backgrounds if they are inside dark cards
// Actually, inputs in dark mode look fine with white bg or we can leave them.

fs.writeFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', code);
console.log('Layout wrapped and cards styled');

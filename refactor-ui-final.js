const fs = require('fs');
let lines = fs.readFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', 'utf8').split('\n');

function findBlockByComment(query) {
  const commentIdx = lines.findIndex(l => l.includes(query));
  if (commentIdx === -1) return [-1, -1];
  let startIdx = commentIdx;
  while (!lines[startIdx].includes('<div') && startIdx < lines.length) startIdx++;
  let openDivs = 0;
  let endIdx = -1;
  for (let i = startIdx; i < lines.length; i++) {
    if (lines[i].includes('<div')) openDivs += (lines[i].match(/<div/g) || []).length;
    if (lines[i].includes('</div')) openDivs -= (lines[i].match(/<\/div/g) || []).length;
    if (openDivs === 0) {
      endIdx = i;
      break;
    }
  }
  if (lines[commentIdx - 1] && lines[commentIdx - 1].includes('&& (')) {
     startIdx = commentIdx - 1;
     endIdx++;
     if (lines[endIdx + 1] && lines[endIdx + 1].includes(')}')) {
        endIdx++;
     }
  } else if (lines[commentIdx + 1] && lines[commentIdx + 1].includes('&& (')) {
     endIdx++;
     if (lines[endIdx + 1] && lines[endIdx + 1].includes(')}')) {
        endIdx++;
     }
  }
  return [startIdx > commentIdx ? commentIdx : startIdx, endIdx];
}

// 1. Fix CSS for music-card
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('.music-card {')) {
    let j = i;
    while (!lines[j].includes('}')) {
      if (lines[j].includes('background-color: #f8f9fa;')) {
        lines[j] = lines[j].replace('#f8f9fa', '#1e293b');
      }
      if (lines[j].includes('border: 1px solid #e9ecef;')) {
        lines[j] = lines[j].replace('#e9ecef', '#334155');
      }
      j++;
    }
  }
}

// Fix flex layout
const mainContentIdx = lines.findIndex(l => l.includes('<div className="main-content">'));
if (mainContentIdx !== -1) {
  lines[mainContentIdx] = lines[mainContentIdx].replace('<div className="main-content">', '<div className="main-content" style={{ display: \'flex\', flexDirection: \'column\', flex: 1, height: \'100%\', overflow: \'hidden\' }}>');
}
const resultSectionIdx = lines.findIndex(l => l.includes('<div className="result-section">'));
if (resultSectionIdx !== -1) {
  lines[resultSectionIdx] = lines[resultSectionIdx].replace('<div className="result-section">', '<div className="result-section" style={{ display: \'flex\', flexDirection: \'column\', flex: 1, minHeight: 0, height: \'100%\' }}>');
}

// 2. Extract Scene Media Editor
const [sceneEditorStart, sceneEditorEnd] = findBlockByComment('{/* SCENE MEDIA EDITOR */}');
let sceneEditorBlock = [];
if (sceneEditorStart !== -1) {
  sceneEditorBlock = lines.splice(sceneEditorStart, sceneEditorEnd - sceneEditorStart + 1);
}

// 3. Extract Music Card
const musicCardStart = lines.findIndex(l => l.includes('<div className="music-card">'));
let musicCardEnd = -1;
if (musicCardStart !== -1) {
  let openDivs = 0;
  for (let i = musicCardStart; i < lines.length; i++) {
    if (lines[i].includes('<div')) openDivs += (lines[i].match(/<div/g) || []).length;
    if (lines[i].includes('</div')) openDivs -= (lines[i].match(/<\/div/g) || []).length;
    if (openDivs === 0) {
      musicCardEnd = i;
      break;
    }
  }
}
let musicCardBlock = [];
if (musicCardStart !== -1) {
  musicCardBlock = lines.splice(musicCardStart, musicCardEnd - musicCardStart + 1);
  musicCardBlock.unshift('                  {/* MUSIC SUGGESTIONS */}');
}

// 4. Insert Scene Editor into Clip Adjustments
const clipAdjustEnd = lines.findIndex(l => l.includes('✂️ Split at Playhead'));
if (clipAdjustEnd !== -1 && sceneEditorBlock.length > 0) {
  let insertIdx = clipAdjustEnd + 3; // wait, let's find the closing div of the Split at playhead
  lines.splice(insertIdx, 0, ...sceneEditorBlock);
}

// 5. Insert Music Card into Right Inspector
const voiceoverEnd = lines.findIndex(l => l.includes('<div style={{ fontSize: \'11px\''));
if (voiceoverEnd !== -1 && musicCardBlock.length > 0) {
  // find end of Voiceover block
  let insertIdx = voiceoverEnd + 6; 
  lines.splice(insertIdx, 0, ...musicCardBlock);
}

// 6. Change Timeline Assets wrapper
const timelineAssetsIdx = lines.findIndex(l => l.includes('Timeline Assets</h3>'));
if (timelineAssetsIdx !== -1) {
   // The parent is <div style={{ background: '#0f172a', padding: '20px'...
   const parentIdx = timelineAssetsIdx - 1;
   lines[parentIdx] = lines[parentIdx].replace('padding: \'20px\'', 'padding: \'10px 20px\'').replace('background: \'#0f172a\'', 'background: \'transparent\'').replace('border: \'1px solid #e9ecef\'', 'border: \'none\'');
}

fs.writeFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', lines.join('\n'));
console.log('UI refactored successfully.');

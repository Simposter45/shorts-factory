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
  // Include the condition wrapper if it exists (e.g., {result.scenes... && ( )})
  if (lines[commentIdx + 1].includes('&& (')) {
     endIdx++; // close parenthesis
     if (lines[endIdx + 1] && lines[endIdx + 1].includes(')}')) {
        endIdx++;
     }
  }
  return [commentIdx, endIdx];
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
}

// 4. Insert Scene Editor into Clip Adjustments
const clipAdjustEnd = lines.findIndex(l => l.includes('✂️ Split at Playhead'));
if (clipAdjustEnd !== -1 && sceneEditorBlock.length > 0) {
  // Find the div wrapper for the Split at Playhead button
  let insertIdx = clipAdjustEnd + 2; // after </button> and </div>
  lines.splice(insertIdx, 0, ...sceneEditorBlock);
}

// 5. Insert Music Card into Right Inspector
const voiceoverEnd = lines.findIndex(l => l.includes('<div style={{ fontSize: \'11px\''));
if (voiceoverEnd !== -1 && musicCardBlock.length > 0) {
  // find end of Voiceover block
  let insertIdx = voiceoverEnd + 6; 
  lines.splice(insertIdx, 0, ...musicCardBlock);
}

fs.writeFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', lines.join('\n'));
console.log('UI refactored successfully.');

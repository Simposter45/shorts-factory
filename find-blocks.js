const fs = require('fs');
const lines = fs.readFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', 'utf8').split('\n');

function findBlock(query) {
  const start = lines.findIndex(l => l.includes(query));
  if (start === -1) return [-1, -1];
  let openDivs = 0;
  let end = -1;
  for (let i = start; i < lines.length; i++) {
    if (lines[i].includes('<div')) openDivs += (lines[i].match(/<div/g) || []).length;
    if (lines[i].includes('</div')) openDivs -= (lines[i].match(/<\/div/g) || []).length;
    if (openDivs === 0) {
      end = i;
      break;
    }
  }
  return [start, end];
}

console.log('Music Card:', findBlock('<div className="music-card">'));
console.log('Scene Media Editor:', findBlock('{/* SCENE MEDIA EDITOR */}'));
console.log('Clip Adjustments (Selected Scene):', lines.findIndex(l => l.includes('scene.id === selectedSceneId')));
console.log('Right Inspector:', findBlock('<div style={{ width: \'450px\', display: \'flex\', flexDirection: \'column\''));
console.log('Left Player Buttons:', lines.findIndex(l => l.includes('<button') && l.includes('setIsPlaying(!isPlaying)')));

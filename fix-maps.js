const fs = require('fs');
let code = fs.readFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', 'utf8');

code = code.replace(/result\.scenes\.map/g, '(result.scenes || []).map');
code = code.replace(/result\.scenes\.length/g, '(result.scenes || []).length');
code = code.replace(/result\.voiceoverSubtitles\.map/g, '(result.voiceoverSubtitles || []).map');
code = code.replace(/result\.voiceoverSubtitles\.length/g, '(result.voiceoverSubtitles || []).length');
code = code.replace(/result\.musicSuggestions\.map/g, '(result.musicSuggestions || []).map');
code = code.replace(/result\.musicSuggestions\.length/g, '(result.musicSuggestions || []).length');
code = code.replace(/getSceneTimings\(result\.scenes\)/g, 'getSceneTimings(result.scenes || [])');

fs.writeFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', code);
console.log('Added optional chaining to array usages.');

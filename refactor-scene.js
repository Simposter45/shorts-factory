const fs = require('fs');

function refactorSceneEditor() {
  let lines = fs.readFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', 'utf8').split('\n');

  // 1. Make Left Player sticky
  const playerIdx = lines.findIndex(l => l.includes('{/* Left: Video Player Preview */}'));
  if (playerIdx !== -1) {
    const containerIdx = playerIdx + 1;
    // Replace the container style to make it sticky
    lines[containerIdx] = lines[containerIdx].replace(
      /display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'/,
      'display: \'flex\', flexDirection: \'column\', alignItems: \'center\', justifyContent: \'center\', position: \'sticky\', top: 0, alignSelf: \'flex-start\''
    );
  }

  // 2. Find "Clip Adjustments" header and change to "Scene Media Editor"
  const clipHeaderIdx = lines.findIndex(l => l.includes('Clip Adjustments'));
  if (clipHeaderIdx !== -1) {
    lines[clipHeaderIdx] = lines[clipHeaderIdx].replace('Clip Adjustments', 'Scene Media Editor');
  }

  // 3. Find the end of "✂️ Split at Playhead" button (around line 1220)
  const splitBtnIdx = lines.findIndex(l => l.includes('✂️ Split at Playhead'));
  let insertIdx = -1;
  if (splitBtnIdx !== -1) {
    // Look for the closing div
    for (let i = splitBtnIdx; i < lines.length; i++) {
      if (lines[i].includes('</div>')) {
        insertIdx = i + 1;
        break;
      }
    }
  }

  // 4. Create the new buttons to insert
  const newButtons = `
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                          <label style={{ padding: '6px 12px', background: '#10b981', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', margin: 0 }}>
                            Upload Media
                            <input type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const url = URL.createObjectURL(file);
                                setResult(prev => {
                                  if (!prev) return prev;
                                  const newScenes = [...prev.scenes];
                                  const idx = newScenes.findIndex(s => s.id === scene.id);
                                  if (idx !== -1) newScenes[idx] = { ...newScenes[idx], mediaUrl: url };
                                  return { ...prev, scenes: newScenes };
                                });
                              }
                            }} />
                          </label>
                          <button 
                            onClick={() => {
                              setSearchModalSceneId(scene.id);
                              setSearchModalQuery(scene.searchQuery);
                              setIsSearchModalOpen(true);
                              setSearchModalResults([]);
                              setTrimmerVideo(null);
                              setTrimmerStartTime(0);
                            }}
                            style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                          >
                            🔍 Search Web / Pexels
                          </button>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                           <button 
                            onClick={() => {
                              setResult(prev => {
                                if (!prev) return prev;
                                const newScenes = [...prev.scenes];
                                const idx = newScenes.findIndex(s => s.id === scene.id);
                                if (idx !== -1) {
                                  newScenes.splice(idx + 1, 0, { id: \`scene_\${Date.now()}_\${Math.random()}\`, duration: 3, assetType: 'video', searchQuery: 'New Custom Scene', textOverlay: null, transitionNext: null } as any);
                                }
                                return { ...prev, scenes: newScenes };
                              });
                            }} 
                            style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '4px', background: '#3b82f6', border: 'none', cursor: 'pointer', color: 'white', fontWeight: 'bold' }}
                          >
                            + Insert New Scene After
                          </button>
                        </div>
`;

  if (insertIdx !== -1) {
    lines.splice(insertIdx, 0, newButtons);
  }

  // 5. Remove the old "SCENE MEDIA EDITOR" list block
  // It starts with {/* SCENE MEDIA EDITOR */}
  const oldEditorStart = lines.findIndex(l => l.includes('{/* SCENE MEDIA EDITOR */}'));
  if (oldEditorStart !== -1) {
    // Find where the old editor ends. It ends when we see the closing React.Fragment of the mapping.
    // The structure is: 
    // {result.scenes && ... (
    //   <div ...>
    //     <h4>Scene Media Editor</h4>
    //     ...
    //   </div>
    // )}
    // And then `</React.Fragment>` at line 1506!
    // Let's count divs carefully.
    let openBrackets = 0;
    let endIdx = -1;
    let started = false;
    for (let i = oldEditorStart + 1; i < lines.length; i++) {
       if (lines[i].includes('result.scenes &&') && lines[i].includes('length > 0 && (')) {
         started = true;
         openBrackets++;
       }
       if (started) {
         if (lines[i].includes('(')) openBrackets += (lines[i].match(/\(/g) || []).length;
         if (lines[i].includes(')')) openBrackets -= (lines[i].match(/\)/g) || []).length;
         if (openBrackets <= 0) {
            endIdx = i;
            break;
         }
       }
    }
    
    // An easier way: The old scene editor list is a block starting at 1222 and ending around 1481 before the transition button.
    // Let's just delete from "{/* SCENE MEDIA EDITOR */}" down to just before the transition button `index < (result.scenes || []).length - 1 && (`
    let transitionIdx = -1;
    for (let i = oldEditorStart; i < lines.length; i++) {
       if (lines[i].includes('index < (result.scenes || []).length - 1 && (')) {
          transitionIdx = i;
          break;
       }
    }
    
    if (transitionIdx !== -1) {
       lines.splice(oldEditorStart, transitionIdx - oldEditorStart);
    }
  }

  fs.writeFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', lines.join('\n'));
}

refactorSceneEditor();
console.log('Scene Editor refactored.');

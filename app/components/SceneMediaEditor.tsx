'use client';

import React from 'react';
import type { StoryboardResponse, Scene } from '../../types';

interface SceneMediaEditorProps {
  result: StoryboardResponse;
  selectedSceneId: string | null;
  previewTime: number;
  setResult: React.Dispatch<React.SetStateAction<StoryboardResponse | null>>;
  setSearchModalSceneId: (id: string | null) => void;
  setSearchModalQuery: (q: string) => void;
  setIsSearchModalOpen: (v: boolean) => void;
  setSearchModalResults: (r: any[]) => void;
  setTrimmerVideo: (v: any) => void;
  setTrimmerStartTime: (t: number) => void;
  updateDuration: (sceneId: string, duration: number) => void;
  getSceneTimings: (scenes: Scene[]) => { scene: Scene; start: number; end: number; globalEnd: number }[];
  handleSwapMedia: (sceneId: string, customQuery: string) => void;
  localFiles: Record<string, File>;
  setLocalFiles: React.Dispatch<React.SetStateAction<Record<string, File>>>;
  avatarEnabled?: boolean;
  setAvatarEnabled?: (v: boolean) => void;
  characterSelect?: string;
  setCharacterSelect?: (v: string) => void;
  reactionFaceFile?: File | null;
  setReactionFaceFile?: (f: File | null) => void;
  reactionFacePosition?: string;
  setReactionFacePosition?: (v: string) => void;
  avatarPreviewRef2?: React.RefObject<HTMLDivElement>;
}

export default function SceneMediaEditor({
  result, selectedSceneId, previewTime,
  setResult, setSearchModalSceneId, setSearchModalQuery,
  setIsSearchModalOpen, setSearchModalResults,
  setTrimmerVideo, setTrimmerStartTime,
  updateDuration, getSceneTimings, handleSwapMedia, localFiles, setLocalFiles,
  avatarEnabled, setAvatarEnabled, characterSelect, setCharacterSelect,
  reactionFaceFile, setReactionFaceFile, reactionFacePosition, setReactionFacePosition,
  avatarPreviewRef2
}: SceneMediaEditorProps) {
  const [quickSwapQuery, setQuickSwapQuery] = React.useState('');

  React.useEffect(() => {
    if (selectedSceneId && result.scenes) {
      const activeScene = result.scenes.find(s => s.id === selectedSceneId);
      if (activeScene) {
        setQuickSwapQuery(activeScene.searchQuery || '');
      }
    }
  }, [selectedSceneId, result.scenes]);

  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', maxHeight: '400px', overflowY: 'auto', color: 'white' }}>
      <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', color: 'white' }}>Scene Media Editor</h3>

      {!selectedSceneId ? (
        <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', background: '#1e293b', borderRadius: '8px', border: '1px dashed #334155' }}>
          👆 Select a clip in the timeline below to view and edit its properties.
        </div>
      ) : (result.scenes || []).map((scene, index) => scene.id === selectedSceneId ? (
        <React.Fragment key={scene.id}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #334155' }}>
            {/* Thumbnail */}
            <div style={{ width: '120px', height: '70px', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#000', flexShrink: 0 }}>
              {scene.mediaUrl && (
                (scene.mediaUrl.includes('pollinations.ai') || scene.mediaUrl.includes('unsplash') || scene.mediaUrl.includes('wikimedia') || scene.mediaUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) ? (
                  <img src={scene.mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                ) : (
                  <video
                    src={scene.mediaUrl}
                    muted loop playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onLoadedMetadata={(e) => {
                      const dur = e.currentTarget.duration;
                      if (dur && (!scene.maxDuration || scene.maxDuration !== dur) && dur !== Infinity) {
                        setResult(prev => {
                          if (!prev) return prev;
                          return { ...prev, scenes: prev.scenes.map(s => s.id === scene.id ? { ...s, maxDuration: dur } : s) };
                        });
                      }
                    }}
                  />
                )
              )}
            </div>

            {/* Controls */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Header: Title and Duration */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '16px', color: '#f8fafc' }}>Scene {index + 1}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '12px', color: '#94a3b8' }}>Duration:</label>
                  <input
                    type="number"
                    value={scene.duration}
                    onChange={(e) => {
                      let val = parseFloat(e.target.value);
                      if (isNaN(val)) return;
                      if (scene.maxDuration) val = Math.min(scene.maxDuration, val);
                      val = Math.max(1, val);
                      updateDuration(scene.id, val);
                    }}
                    style={{ width: '56px', padding: '4px 6px', border: '1px solid #334155', background: '#0f172a', color: 'white', borderRadius: '4px', fontSize: '12px', outline: 'none' }}
                    min="1" max={scene.maxDuration || 30} step="0.5"
                  />
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>sec</span>
                </div>
              </div>

              {/* Sub-header: Auto-generated Text & Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.4' }}>
                  {scene.description}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Effect */}
                  <select
                    value={scene.animation || ''}
                    onChange={(e) => {
                      setResult(prev => {
                        if (!prev) return prev;
                        return { ...prev, scenes: prev.scenes.map(s => s.id === scene.id ? { ...s, animation: e.target.value as any } : s) };
                      });
                    }}
                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: '12px', outline: 'none' }}
                  >
                    <option value="">No Effect</option>
                    <option value="pan-left-right">Pan Left → Right</option>
                    <option value="pan-right-left">Pan Right → Left</option>
                    <option value="zoom-in">Zoom In</option>
                    <option value="zoom-out">Zoom Out</option>
                  </select>

                  <button
                    onClick={() => {
                      const time = previewTime;
                      const timings = getSceneTimings(result.scenes!);
                      const t = timings.find(t => t.scene.id === scene.id);
                      if (!t) return;
                      if (time <= t.start + 0.1 || time >= t.globalEnd - 0.1) {
                        alert("Please pause the preview somewhere in the middle of this scene to split it.");
                        return;
                      }
                      
                      const splitOffset = time - t.start;
                      const splitDuration1 = Number(splitOffset.toFixed(2));
                      const splitDuration2 = Number((scene.duration - splitDuration1).toFixed(2));
                      
                      setResult(prev => {
                        if (!prev) return prev;
                        const newScenes = [...prev.scenes];
                        const idx = newScenes.findIndex(s => s.id === scene.id);
                        if (idx !== -1) {
                          const s1 = { ...newScenes[idx], duration: splitDuration1 };
                          const s2 = { ...newScenes[idx], id: `scene_split_${Date.now()}`, duration: splitDuration2 };
                          newScenes.splice(idx, 1, s1, s2);
                        }
                        return { ...prev, scenes: newScenes };
                      });
                    }}
                    style={{ padding: '4px 8px', background: '#475569', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    ✂ Split
                  </button>
                  <button
                    onClick={() => {
                      setResult(prev => {
                        if (!prev) return prev;
                        const newScenes = [...prev.scenes];
                        const idx = newScenes.findIndex(s => s.id === scene.id);
                        if (idx !== -1) {
                          newScenes.splice(idx + 1, 0, {
                            id: `scene_new_${Date.now()}`,
                            description: "New Blank Scene",
                            searchQuery: "",
                            assetType: "specific",
                            mediaUrl: "",
                            duration: 3
                          });
                        }
                        return { ...prev, scenes: newScenes };
                      });
                    }}
                    style={{ padding: '4px 8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    + Insert After
                  </button>
                  <button
                    onClick={() => {
                      if(result.scenes && result.scenes.length <= 1) {
                        alert("You must have at least one scene.");
                        return;
                      }
                      setResult(prev => {
                        if (!prev) return prev;
                        return { ...prev, scenes: prev.scenes.filter(s => s.id !== scene.id) };
                      });
                    }}
                    style={{ padding: '4px 8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>

              {/* Reveal Settings */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: '#f8fafc', fontWeight: 600 }}>
                  <input 
                    type="checkbox" 
                    checked={!!scene.auraFilter}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setResult(prev => {
                        if (!prev) return prev;
                        const newScenes = prev.scenes.map(s => s.id === scene.id ? { ...s, auraFilter: checked } : s);
                        return { ...prev, scenes: newScenes };
                      });
                    }}
                  />
                  ✨ Apply "Aura" Edit (Keeps original photo)
                </label>

              {/* Row 2: Media Swapping Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0f172a', padding: '8px', borderRadius: '8px', border: '1px solid #334155', flexWrap: 'wrap' }}>
                <label style={{ padding: '6px 12px', background: '#10b981', color: 'white', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  📤 Upload
                  <input
                    type="file"
                    accept="image/*,video/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = URL.createObjectURL(file);
                        // Store the file in localFiles so it can be sent to the backend
                        setLocalFiles(prev => ({ ...prev, [scene.id]: file }));
                        setResult(prev => {
                          if (!prev) return prev;
                          const newScenes = [...prev.scenes];
                          const idx = newScenes.findIndex(s => s.id === scene.id);
                          if (idx !== -1) newScenes[idx] = { ...newScenes[idx], mediaUrl: url };
                          return { ...prev, scenes: newScenes };
                        });
                      }
                    }}
                  />
                </label>

                {/* Local file attached badge */}
                {localFiles[scene.id] && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#064e3b', border: '1px solid #10b981', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', color: '#6ee7b7', fontWeight: 600, maxWidth: '200px' }}>
                    <span>📁</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={localFiles[scene.id].name}>
                      {localFiles[scene.id].name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setLocalFiles(prev => {
                          const nf = { ...prev };
                          delete nf[scene.id];
                          return nf;
                        });
                        setResult(prev => {
                          if (!prev) return prev;
                          const newScenes = [...prev.scenes];
                          const idx = newScenes.findIndex(s => s.id === scene.id);
                          if (idx !== -1) newScenes[idx] = { ...newScenes[idx], mediaUrl: `https://images.unsplash.com/photo-1518605368461-1e1e1146313b?q=80&w=800&auto=format&fit=crop&text=Reset` };
                          return { ...prev, scenes: newScenes };
                        });
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#6ee7b7', cursor: 'pointer', padding: '0 2px', fontSize: '12px' }}
                    >
                      ✕
                    </button>
                  </div>
                )}
                
                <button
                  onClick={() => {
                    setSearchModalSceneId(scene.id);
                    setSearchModalQuery(scene.searchQuery || '');
                    setIsSearchModalOpen(true);
                    setSearchModalResults([]);
                  }}
                  style={{ padding: '6px 12px', background: '#ef4444', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  🔍 Search Web
                </button>

                <div style={{ flex: 1 }} />
                
                {/* Custom AI / Swap */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="text"
                    value={quickSwapQuery}
                    onChange={(e) => setQuickSwapQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && quickSwapQuery.trim()) {
                        handleSwapMedia(scene.id, quickSwapQuery);
                      }
                    }}
                    placeholder="Describe image..."
                    style={{ width: '160px', padding: '6px', border: '1px solid #334155', borderRadius: '4px', fontSize: '12px', background: '#1e293b', color: 'white' }}
                  />
                  <button
                    onClick={() => quickSwapQuery.trim() && handleSwapMedia(scene.id, quickSwapQuery)}
                    style={{ padding: '6px 12px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    🔄 Swap
                  </button>
                </div>
              </div>

              {/* Row 3: Text Overlay Editor */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0f172a', padding: '8px', borderRadius: '8px', border: '1px solid #334155', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Text Overlay:</span>
                {scene.textOverlay ? (
                  <>
                    <input
                      type="text"
                      value={scene.textOverlay.text}
                      onChange={(e) => {
                        setResult(prev => {
                          if (!prev) return prev;
                          return { ...prev, scenes: prev.scenes.map(s => s.id === scene.id ? { ...s, textOverlay: { ...s.textOverlay!, text: e.target.value } } : s) };
                        });
                      }}
                      style={{ flex: 1, padding: '4px 8px', borderRadius: '4px', border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: '12px' }}
                      placeholder="Enter overlay text..."
                    />
                    <select
                      value={scene.textOverlay.position || 'bottom'}
                      onChange={(e) => {
                        setResult(prev => {
                          if (!prev) return prev;
                          return { ...prev, scenes: prev.scenes.map(s => s.id === scene.id ? { ...s, textOverlay: { ...s.textOverlay!, position: e.target.value as any } } : s) };
                        });
                      }}
                      style={{ padding: '4px', borderRadius: '4px', border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: '12px' }}
                    >
                      <option value="top">Top</option>
                      <option value="middle">Middle</option>
                      <option value="bottom">Bottom</option>
                    </select>
                    <button
                      onClick={() => {
                        setResult(prev => {
                          if (!prev) return prev;
                          return { ...prev, scenes: prev.scenes.map(s => s.id === scene.id ? { ...s, textOverlay: undefined } : s) };
                        });
                      }}
                      style={{ padding: '4px 8px', background: '#450a0a', color: '#ef4444', border: '1px solid #7f1d1d', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setResult(prev => {
                        if (!prev) return prev;
                        return { ...prev, scenes: prev.scenes.map(s => s.id === scene.id ? { ...s, textOverlay: { text: 'New Overlay', startTime: 0, duration: s.duration, position: 'middle' } } : s) };
                      });
                    }}
                    style={{ padding: '4px 8px', background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    + Add Overlay
                  </button>
                )}
              </div>

              {/* Persona Toggle moved below the entire scene preview & controls */}
              <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '12px', color: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', color: 'white' }}>Character Persona</h3>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                    <span style={{ fontSize: '12px', color: avatarEnabled ? '#10b981' : '#94a3b8', fontWeight: 600 }}>
                      {avatarEnabled ? 'ON' : 'OFF'}
                    </span>
                    <div
                      onClick={() => setAvatarEnabled?.(!avatarEnabled)}
                      style={{
                        position: 'relative', width: '36px', height: '20px',
                        background: avatarEnabled ? '#10b981' : '#475569',
                        borderRadius: '10px', cursor: 'pointer',
                        transition: 'background 0.2s ease',
                        flexShrink: 0,
                      }}
                    >
                      <div style={{
                        position: 'absolute', top: '2px',
                        left: avatarEnabled ? '18px' : '2px',
                        width: '16px', height: '16px',
                        background: 'white', borderRadius: '50%',
                        transition: 'left 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      }} />
                    </div>
                  </label>
                </div>

                {avatarEnabled && (
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginTop: '12px', borderTop: '1px solid #334155', paddingTop: '12px' }}>
                    <div
                      ref={avatarPreviewRef2}
                      style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #ccc', flexShrink: 0, backgroundColor: '#f0f0f0' }}
                    >
                      <img
                        src={characterSelect === 'custom' && reactionFaceFile ? URL.createObjectURL(reactionFaceFile) : `/${characterSelect}.png`}
                        alt="Avatar"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <select
                          value={characterSelect}
                          onChange={(e) => setCharacterSelect?.(e.target.value)}
                          style={{ padding: '4px', border: '1px solid #ccc', borderRadius: '4px', width: '100%', fontSize: '12px' }}
                        >
                          <option value="commentator_1">Character A: The Pro</option>
                          <option value="commentator_2">Character B: The Analyst</option>
                          <option value="commentator_3">Character C: The Fan</option>
                          <option value="custom">Custom Upload...</option>
                        </select>
                        <select
                          value={reactionFacePosition}
                          onChange={(e) => setReactionFacePosition?.(e.target.value)}
                          style={{ padding: '4px', border: '1px solid #ccc', borderRadius: '4px', width: '100%', fontSize: '12px' }}
                        >
                          <option value="bottom-right">Bottom Right</option>
                          <option value="bottom-left">Bottom Left</option>
                          <option value="top-right">Top Right</option>
                          <option value="top-left">Top Left</option>
                        </select>
                      </div>
                      {characterSelect === 'custom' && (
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={(e) => setReactionFaceFile?.(e.target.files?.[0] || null)}
                          style={{ padding: '4px', border: '1px solid #ccc', borderRadius: '4px', width: '100%', fontSize: '12px' }}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </React.Fragment>
      ) : null)}
    </div>
  );
}

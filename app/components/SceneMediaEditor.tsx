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
}

export default function SceneMediaEditor({
  result, selectedSceneId, previewTime,
  setResult, setSearchModalSceneId, setSearchModalQuery,
  setIsSearchModalOpen, setSearchModalResults,
  setTrimmerVideo, setTrimmerStartTime,
  updateDuration, getSceneTimings, handleSwapMedia,
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
                (scene.mediaUrl.includes('unsplash') || scene.mediaUrl.includes('wikimedia') || scene.mediaUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) ? (
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

              {/* Description */}
              <p style={{ fontSize: '13px', margin: 0, color: '#cbd5e1', lineHeight: '1.4' }}>
                {scene.description}
              </p>

              {/* Row 1: Effect, Split, Insert */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0f172a', padding: '4px 8px', borderRadius: '6px', border: '1px solid #334155' }}>
                  <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Effect:</label>
                  <select
                    value={scene.animation || 'none'}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setResult(prev => {
                        if (!prev) return prev;
                        const newScenes = prev.scenes.map(s => s.id === scene.id ? { ...s, animation: val } : s);
                        return { ...prev, scenes: newScenes };
                      });
                    }}
                    style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="none">None</option>
                    <option value="zoom-in">Zoom In</option>
                    <option value="zoom-out">Zoom Out</option>
                    <option value="pan-left-right">Pan Left ➔ Right</option>
                    <option value="pan-right-left">Pan Right ➔ Left</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    const timings = getSceneTimings(result.scenes || []);
                    const currentTiming = timings.find(t => t.scene.id === scene.id);
                    if (!currentTiming) return;
                    const scenePlayhead = previewTime - currentTiming.start;
                    if (scenePlayhead <= 0 || scenePlayhead >= scene.duration) {
                      alert('Move the red playhead line inside this clip to split it.');
                      return;
                    }
                    setResult(prev => {
                      if (!prev) return prev;
                      const newScenes = [...prev.scenes];
                      const sceneIdx = newScenes.findIndex(s => s.id === scene.id);
                      const firstHalf = { ...scene, duration: parseFloat(scenePlayhead.toFixed(2)) };
                      const secondHalf = {
                        ...scene,
                        id: `scene_${Date.now()}_${Math.random()}`,
                        duration: parseFloat((scene.duration - scenePlayhead).toFixed(2)),
                        mediaStartTime: (scene.mediaStartTime || 0) + scenePlayhead,
                      };
                      newScenes.splice(sceneIdx, 1, firstHalf, secondHalf);
                      return { ...prev, scenes: newScenes };
                    });
                  }}
                  style={{ padding: '6px 12px', background: '#334155', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Split this clip into two at the red playhead line"
                >
                  ✂️ Split
                </button>

                <button
                  onClick={() => {
                    setResult(prev => {
                      if (!prev) return prev;
                      const newScenes = [...prev.scenes];
                      const idx = newScenes.findIndex(s => s.id === scene.id);
                      if (idx !== -1) {
                        newScenes.splice(idx + 1, 0, {
                          id: `scene_${Date.now()}_${Math.random()}`,
                          duration: 3,
                          assetType: 'video',
                          searchQuery: 'New Custom Scene',
                          textOverlay: null,
                          transitionNext: null,
                        } as any);
                      }
                      return { ...prev, scenes: newScenes };
                    });
                  }}
                  style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  ➕ Insert After
                </button>

                <button
                  onClick={() => {
                    const confirmDelete = window.confirm('Are you sure you want to delete this scene?');
                    if (!confirmDelete) return;
                    setResult(prev => {
                      if (!prev) return prev;
                      const newScenes = prev.scenes.filter(s => s.id !== scene.id);
                      return { ...prev, scenes: newScenes };
                    });
                  }}
                  style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Delete this clip completely"
                >
                  🗑️ Delete
                </button>
              </div>

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
                
                <button
                  onClick={() => {
                    setSearchModalSceneId(scene.id);
                    setSearchModalQuery(scene.searchQuery);
                    setIsSearchModalOpen(true);
                    setSearchModalResults([]);
                    setTrimmerVideo(null);
                    setTrimmerStartTime(0);
                  }}
                  style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  🔍 Search Web
                </button>

                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginLeft: 'auto', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    value={quickSwapQuery}
                    onChange={(e) => setQuickSwapQuery(e.target.value)}
                    style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #334155', background: '#1e293b', color: 'white', fontSize: '12px', width: '160px', outline: 'none' }}
                    placeholder="Swap search query..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && quickSwapQuery.trim()) {
                        handleSwapMedia(scene.id, quickSwapQuery);
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (quickSwapQuery.trim()) {
                        handleSwapMedia(scene.id, quickSwapQuery);
                      }
                    }}
                    style={{ padding: '6px 12px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                    title="Quickly swap media using this query"
                  >
                    🔄 Swap
                  </button>
                </div>
              </div>
            </div>
          </div>
        </React.Fragment>
      ) : null)}
    </div>
  );
}

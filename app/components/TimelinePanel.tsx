'use client';

import React from 'react';
import type { StoryboardResponse, Scene } from '../../types';

interface TimelinePanelProps {
  result: StoryboardResponse;
  previewTime: number;
  setPreviewTime: (t: number) => void;
  audioDuration: number;
  audioFile: File | null;
  selectedBgm: string;
  bgMusicFile: File | null;
  selectedSceneId: string | null;
  setSelectedSceneId: (id: string | null) => void;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  setResult: React.Dispatch<React.SetStateAction<StoryboardResponse | null>>;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  previewTimerRef: React.MutableRefObject<number | null>;
  getSceneTimings: (scenes: Scene[]) => { scene: Scene; start: number; end: number; globalEnd: number }[];
}

export default function TimelinePanel({
  result, previewTime, setPreviewTime,
  audioDuration, audioFile, selectedBgm, bgMusicFile,
  selectedSceneId, setSelectedSceneId,
  isPlaying, setIsPlaying,
  setResult, audioRef, previewTimerRef,
  getSceneTimings,
}: TimelinePanelProps) {
  const timings = getSceneTimings(result.scenes || []);
  const totalWidth = timings.length > 0 ? `${timings[timings.length - 1].end * 40}px` : 'max-content';

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPlaying) {
      if (audioRef.current) audioRef.current.pause();
      if (previewTimerRef.current) clearInterval(previewTimerRef.current);
      setIsPlaying(false);
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const newTime = Math.max(0, (e.clientX - rect.left) / 40);
    const totalDur = timings.length > 0 ? timings[timings.length - 1].end : 0;
    const clampedTime = Math.min(newTime, totalDur);
    setPreviewTime(clampedTime);
    if (audioRef.current) audioRef.current.currentTime = clampedTime;
  };

  const handleScrubMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const newTime = Math.max(0, (e.clientX - rect.left) / 40);
    const totalDur = timings.length > 0 ? timings[timings.length - 1].end : 0;
    const clampedTime = Math.min(newTime, totalDur);
    setPreviewTime(clampedTime);
    if (audioRef.current) audioRef.current.currentTime = clampedTime;
  };

  return (
    <div style={{ height: '280px', flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#1e293b', borderTop: '1px solid #0f172a', padding: '16px', overflowY: 'auto' }}>
      <div style={{ background: 'transparent', padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: 'white' }}>Timeline Assets</h3>
          <div style={{ background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
            ⏱ {previewTime.toFixed(2)}s
          </div>
        </div>
        <div className="timeline-container" style={{ overflowX: 'auto', background: '#020617', border: '1px solid #1e293b', borderRadius: '8px', padding: '16px 16px 32px 16px' }}>
          {/* Scrubable timeline area */}
          <div
            style={{ position: 'relative', width: totalWidth, minWidth: '100%', cursor: 'pointer' }}
            onMouseDown={handleScrub}
            onMouseMove={handleScrubMove}
          >
            {/* Playhead */}
            <div style={{ position: 'absolute', top: -8, bottom: -8, left: `${previewTime * 40}px`, width: '2px', backgroundColor: '#ef4444', zIndex: 50, pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', top: 0, left: '-4px', width: '10px', height: '10px', backgroundColor: '#ef4444', borderRadius: '50%' }} />
            </div>

            {/* Visual / video track */}
            <div className="timeline-track visual-track" style={{ position: 'relative', height: '80px', backgroundColor: '#0f172a', borderRadius: '4px', marginBottom: '8px' }}>
              {timings.map((t, index) => {
                const scene = t.scene;
                const widthPx = scene.duration * 40;
                const leftPx = t.start * 40;
                return (
                  <React.Fragment key={scene.id}>
                    <div
                      onClick={() => setSelectedSceneId(scene.id)}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', index.toString())}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const sourceIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
                        if (sourceIdx === index) return;
                        setResult(prev => {
                          if (!prev) return prev;
                          const newScenes = [...prev.scenes];
                          const [moved] = newScenes.splice(sourceIdx, 1);
                          newScenes.splice(index, 0, moved);
                          return { ...prev, scenes: newScenes };
                        });
                      }}
                      style={{
                        width: `${widthPx}px`, left: `${leftPx}px`, top: 0, bottom: 0,
                        backgroundColor: '#0070f3', borderRight: '1px solid rgba(255,255,255,0.3)',
                        outline: selectedSceneId === scene.id ? '3px solid #10b981' : 'none',
                        outlineOffset: '-3px', position: 'absolute', cursor: 'pointer',
                        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: selectedSceneId === scene.id ? 20 : index,
                      }}
                    >
                      {scene.mediaUrl && (
                        scene.mediaUrl.includes('youtube.com') || scene.mediaUrl.includes('youtu.be') ? (
                          <img src={`https://img.youtube.com/vi/${scene.mediaUrl.split('v=')[1]?.split('&')[0]}/hqdefault.jpg`} alt="" style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
                        ) : (scene.mediaUrl.includes('pollinations.ai') || scene.mediaUrl.includes('unsplash') || scene.mediaUrl.includes('wikimedia') || scene.mediaUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) ? (
                          <img src={scene.mediaUrl} alt="" style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5, filter: scene.auraFilter ? 'contrast(1.4) saturate(1.6) brightness(0.9) drop-shadow(0 0 10px rgba(168,85,247,0.8))' : 'none' }} />
                        ) : (
                          <video src={scene.mediaUrl} muted loop playsInline style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
                        )
                      )}
                      <span style={{ position: 'relative', zIndex: 1, color: 'white', fontSize: '12px', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                        {scene.duration}s
                      </span>
                    </div>
                    {index < (result.scenes || []).length - 1 && (
                      <button
                        onClick={() => {
                          setResult(prev => {
                            if (!prev) return prev;
                            return { ...prev, scenes: prev.scenes.map(s => s.id === scene.id ? { ...s, transitionNext: !s.transitionNext } : s) };
                          });
                        }}
                        style={{
                          position: 'absolute',
                          left: `${(t.end - (scene.transitionNext ? 0.25 : 0)) * 40}px`,
                          top: '50%', transform: 'translate(-50%, -50%)', zIndex: 100,
                          width: '24px', height: '24px', borderRadius: '50%',
                          backgroundColor: scene.transitionNext ? '#10b981' : '#1e293b',
                          color: scene.transitionNext ? '#fff' : '#666',
                          border: '1px solid #334155',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        }}
                        title="Toggle Crossfade Transition"
                      >
                        ⚡
                      </button>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Text overlay track */}
            <div className="timeline-track text-overlay-track" style={{ position: 'relative', height: '24px', backgroundColor: '#0f172a', borderRadius: '4px', marginBottom: '8px' }}>
              {timings.map((t) => {
                const scene = t.scene;
                return (
                  <div key={scene.id} style={{ position: 'absolute', left: `${t.start * 40}px`, width: `${scene.duration * 40}px`, height: '100%', borderRight: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'transparent' }}>
                    {scene.textOverlay && (
                      <div style={{
                        position: 'absolute',
                        left: `${scene.textOverlay.startTime * 40}px`,
                        width: `${scene.textOverlay.duration * 40}px`,
                        height: '100%', backgroundColor: '#fbbf24', borderRadius: '4px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '10px', fontWeight: 'bold', color: '#000',
                        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', padding: '0 4px',
                        cursor: 'pointer', zIndex: 10,
                      }}>
                        {scene.textOverlay.text}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Subtitle track */}
            <div className="timeline-track subtitle-track" style={{ position: 'relative', height: '24px', backgroundColor: '#0f172a', borderRadius: '4px', marginBottom: '8px' }}>
              {result.voiceoverSubtitles?.map((sub) => (
                <div key={sub.id} style={{
                  position: 'absolute', left: `${sub.startTime * 40}px`, width: `${sub.duration * 40}px`,
                  height: '100%', borderRight: '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: '#8b5cf6', borderRadius: '4px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: 'bold', color: '#fff',
                  overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                  padding: '0 4px', cursor: 'pointer',
                }}>
                  {sub.text}
                </div>
              ))}
            </div>

            {/* Audio track */}
            <div className="timeline-track audio-track" style={{ display: 'flex', height: '40px', backgroundColor: '#0f172a', borderRadius: '4px', width: audioDuration > 0 ? `${audioDuration * 40}px` : '100%' }}>
              <div style={{ width: '100%', backgroundColor: audioFile ? '#10b981' : '#334155', opacity: 0.8, borderRadius: '4px', display: 'flex', alignItems: 'center', paddingLeft: '8px', fontSize: '12px', color: 'white', fontWeight: 'bold' }}>
                {audioFile ? `🎤 Voiceover Track (${audioFile.name}) - ${audioDuration.toFixed(1)}s` : 'No Voiceover Track'}
              </div>
            </div>

            {/* BGM track */}
            <div className="timeline-track bgm-track" style={{ display: 'flex', height: '40px', backgroundColor: '#0f172a', borderRadius: '4px', marginTop: '8px', width: timings.length > 0 ? `${timings[timings.length - 1].end * 40}px` : '100%' }}>
              <div style={{ width: '100%', backgroundColor: selectedBgm !== 'none' ? '#3b82f6' : '#334155', opacity: 0.8, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', fontSize: '12px', color: 'white', fontWeight: 'bold' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🎵</span>
                  <span>
                    {selectedBgm === 'none' ? 'No BGM Selected' :
                      selectedBgm === 'custom' ? (bgMusicFile ? bgMusicFile.name : 'Custom Upload (Pending)') :
                      `Background Music (${selectedBgm.replace('_', ' ').toUpperCase()})`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

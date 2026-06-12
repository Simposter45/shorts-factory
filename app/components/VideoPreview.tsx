'use client';

import React from 'react';
import type { StoryboardResponse, Scene } from '../../types';

interface VideoPreviewProps {
  result: StoryboardResponse;
  previewTime: number;
  setPreviewTime: (t: number) => void;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  audioDuration: number;
  audioFile: File | null;
  setAudioFile: (f: File | null) => void;
  bgmVolume: number;
  selectedBgm: string;
  bgMusicFile: File | null;
  reactionFacePosition: string;
  characterSelect: string;
  reactionFaceFile: File | null;
  avatarEnabled: boolean;
  setResult: React.Dispatch<React.SetStateAction<StoryboardResponse | null>>;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  bgmAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
  previewTimerRef: React.MutableRefObject<number | null>;
  audioContextRef: React.MutableRefObject<any>;
  analyserRef: React.MutableRefObject<any>;
  sourceNodeRef: React.MutableRefObject<any>;
  avatarPreviewRef1: React.RefObject<HTMLDivElement>;
  avatarPreviewRef2: React.RefObject<HTMLDivElement>;
  getSceneTimings: (scenes: Scene[]) => { scene: Scene; start: number; end: number; globalEnd: number }[];
}

export default function VideoPreview({
  result, previewTime, setPreviewTime,
  isPlaying, setIsPlaying,
  audioDuration, audioFile,
  bgmVolume, selectedBgm, bgMusicFile,
  reactionFacePosition, characterSelect, reactionFaceFile, avatarEnabled,
  setResult,
  audioRef, bgmAudioRef, previewTimerRef,
  audioContextRef, analyserRef, sourceNodeRef,
  avatarPreviewRef1, avatarPreviewRef2,
  getSceneTimings,
}: VideoPreviewProps) {
  const timings = getSceneTimings(result.scenes || []);

  const handlePlayPause = () => {
    if (isPlaying) {
      // PAUSE
      if (audioRef.current) audioRef.current.pause();
      if (bgmAudioRef.current) bgmAudioRef.current.pause();
      if (previewTimerRef.current) {
        cancelAnimationFrame(previewTimerRef.current);
        previewTimerRef.current = null;
      }
      setIsPlaying(false);
      if (avatarPreviewRef1.current) {
        avatarPreviewRef1.current.style.transform = 'scale(1)';
        avatarPreviewRef1.current.style.boxShadow = 'none';
      }
      if (avatarPreviewRef2.current) {
        avatarPreviewRef2.current.style.transform = 'scale(1)';
        avatarPreviewRef2.current.style.boxShadow = 'none';
      }
    } else {
      // PLAY
      const totalDur = timings.length > 0 ? timings[timings.length - 1].end : 0;
      let startT = previewTime;
      if (startT >= totalDur) { startT = 0; setPreviewTime(0); }

      // Setup BGM
      let bgmUrl = '';
      if (selectedBgm === 'custom' && bgMusicFile) {
        bgmUrl = URL.createObjectURL(bgMusicFile);
      } else if (selectedBgm !== 'none' && selectedBgm !== 'custom') {
        bgmUrl = `/bgm/${selectedBgm}.mp3`;
      }
      if (bgmUrl) {
        const urlObj = new URL(bgmUrl, window.location.origin);
        if (!bgmAudioRef.current || bgmAudioRef.current.src !== urlObj.href) {
          if (bgmAudioRef.current) bgmAudioRef.current.pause();
          bgmAudioRef.current = new Audio(urlObj.href);
          bgmAudioRef.current.loop = true;
        }
        bgmAudioRef.current.volume = bgmVolume;
        bgmAudioRef.current.currentTime = startT;
        bgmAudioRef.current.play().catch(e => console.warn('BGM play failed:', e));
      }

      if (audioFile) {
        if (!audioRef.current) {
          const url = URL.createObjectURL(audioFile);
          audioRef.current = new Audio(url);
          audioRef.current.crossOrigin = 'anonymous';
          audioRef.current.onended = () => {
            setIsPlaying(false);
            if (bgmAudioRef.current) bgmAudioRef.current.pause();
            if (avatarPreviewRef1.current) {
              avatarPreviewRef1.current.style.transform = 'scale(1)';
              avatarPreviewRef1.current.style.boxShadow = 'none';
            }
            if (avatarPreviewRef2.current) {
              avatarPreviewRef2.current.style.transform = 'scale(1)';
              avatarPreviewRef2.current.style.boxShadow = 'none';
            }
          };
          try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContext();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
            sourceNodeRef.current.connect(analyserRef.current);
            analyserRef.current.connect(audioContextRef.current.destination);
          } catch (e) {
            console.warn('Web Audio API setup failed', e);
          }
        }
        if (audioContextRef.current?.state === 'suspended') {
          audioContextRef.current.resume();
        }
        audioRef.current.currentTime = startT;
        audioRef.current.play();

        const updateFrame = () => {
          if (audioRef.current && !audioRef.current.paused) {
            setPreviewTime(audioRef.current.currentTime);
            if (analyserRef.current) {
              const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
              analyserRef.current.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
              const avg = sum / dataArray.length;
              const scale = 1 + (avg / 255) * 0.15;
              const shadowOpacity = (avg / 255) * 0.7;
              const transformStr = `scale(${scale})`;
              const shadowStr = `0 0 0 ${avg / 10}px rgba(16, 185, 129, ${shadowOpacity})`;
              if (avatarPreviewRef1.current) {
                avatarPreviewRef1.current.style.transform = transformStr;
                avatarPreviewRef1.current.style.boxShadow = shadowStr;
              }
              if (avatarPreviewRef2.current) {
                avatarPreviewRef2.current.style.transform = transformStr;
                avatarPreviewRef2.current.style.boxShadow = shadowStr;
              }
            }
            previewTimerRef.current = requestAnimationFrame(updateFrame) as any;
          }
        };
        previewTimerRef.current = requestAnimationFrame(updateFrame) as any;
      } else {
        const startTimeMs = performance.now() - startT * 1000;
        const updateFrame = (now: number) => {
          let currentT = (now - startTimeMs) / 1000;
          if (currentT >= totalDur) {
            setIsPlaying(false);
            if (bgmAudioRef.current) bgmAudioRef.current.pause();
            setPreviewTime(totalDur);
            return;
          }
          setPreviewTime(currentT);
          previewTimerRef.current = requestAnimationFrame(updateFrame) as any;
        };
        previewTimerRef.current = requestAnimationFrame(updateFrame) as any;
      }
      setIsPlaying(true);
    }
  };

  const handleCutClip = () => {
    const activeIndex = timings.findIndex(t => previewTime >= t.start && previewTime < t.end);
    if (activeIndex !== -1) {
      const activeTiming = timings[activeIndex];
      const newDuration = Math.max(0.1, previewTime - activeTiming.start);
      setResult(prev => {
        if (!prev) return prev;
        const newScenes = [...prev.scenes];
        newScenes[activeIndex] = { ...newScenes[activeIndex], duration: parseFloat(newDuration.toFixed(2)) };
        return { ...prev, scenes: newScenes };
      });
    }
  };

  const totalDur = timings.length > 0 ? timings[timings.length - 1].end : 0;
  const handleSeek = (delta: number) => {
    const newTime = Math.max(0, Math.min(previewTime + delta, totalDur));
    setPreviewTime(newTime);
    if (audioRef.current) audioRef.current.currentTime = newTime;
  };

  const handlePlayPauseRef = React.useRef(handlePlayPause);
  const handleSeekRef = React.useRef(handleSeek);
  
  React.useEffect(() => {
    handlePlayPauseRef.current = handlePlayPause;
    handleSeekRef.current = handleSeek;
  });

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayPauseRef.current();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleSeekRef.current(-1);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleSeekRef.current(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div style={{ width: '420px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#020617', borderRight: '1px solid #1e293b' }}>
      
      <div style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', justifyContent: 'center' }}>
        {/* 9:16 Phone Frame */}
        <div style={{ height: '100%', aspectRatio: '9/16', backgroundColor: '#000', borderRadius: '32px', border: '14px solid #1e293b', overflow: 'hidden', position: 'relative', boxShadow: '0 15px 40px rgba(0,0,0,0.8)' }}>
        {timings.map((t, i) => {
          const { scene: activeScene, start: sceneStartTime, end: sceneEndTime } = t;
          const isActive = previewTime >= sceneStartTime && previewTime <= sceneEndTime;
          const sceneTime = isActive ? previewTime - sceneStartTime : 0;

          let imgStyle: any = { width: '100%', height: '100%', objectFit: 'cover', transition: isPlaying ? 'none' : 'transform 0.1s, object-position 0.1s' };
          
          if (activeScene.auraFilter) {
            imgStyle.filter = 'contrast(1.4) saturate(1.6) brightness(0.9) drop-shadow(0 0 10px rgba(168,85,247,0.8))';
          }

          if (isActive && activeScene.mediaUrl && !activeScene.mediaUrl.includes('.mp4')) {
            if (activeScene.animation === 'zoom-in') {
              const scale = 1 + (0.2 * (sceneTime / activeScene.duration));
              imgStyle = { ...imgStyle, transform: `scale(${scale})`, transformOrigin: 'center center' };
            } else if (activeScene.animation === 'zoom-out') {
              const scale = 1.2 - (0.2 * (sceneTime / activeScene.duration));
              imgStyle = { ...imgStyle, transform: `scale(${scale})`, transformOrigin: 'center center' };
            } else if (activeScene.animation === 'pan-left-right') {
              const pos = (sceneTime / activeScene.duration) * 100;
              imgStyle = { ...imgStyle, objectPosition: `${pos}% 50%`, transform: 'scale(1.2)' };
            } else if (activeScene.animation === 'pan-right-left') {
              const pos = 100 - ((sceneTime / activeScene.duration) * 100);
              imgStyle = { ...imgStyle, objectPosition: `${pos}% 50%`, transform: 'scale(1.2)' };
            }
          }

          let opacity = isActive ? 1 : 0;
          if (isActive && i > 0 && timings[i - 1].scene.transitionNext) {
            opacity = Math.max(0, Math.min(1, sceneTime / 0.5));
          }

          return (
            <div key={activeScene.id} style={{ position: 'absolute', inset: 0, opacity, zIndex: isActive ? i : -1, pointerEvents: isActive ? 'auto' : 'none', display: isActive ? 'block' : 'none' }}>
              {activeScene.mediaUrl && (
                activeScene.mediaUrl.includes('youtube.com') || activeScene.mediaUrl.includes('youtu.be') ? (
                  <img src={`https://img.youtube.com/vi/${activeScene.mediaUrl.split('v=')[1]?.split('&')[0]}/hqdefault.jpg`} alt="YouTube Preview" style={imgStyle} />
                ) : activeScene.mediaUrl.includes('pollinations.ai') || activeScene.mediaUrl.includes('unsplash') || activeScene.mediaUrl.includes('wikimedia') || activeScene.mediaUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                  <img src={activeScene.mediaUrl} alt="Preview" style={imgStyle} />
                ) : (
                  <video
                    key={activeScene.mediaUrl + (activeScene.mediaStartTime || 0)}
                    src={activeScene.mediaUrl + (activeScene.mediaStartTime ? `#t=${activeScene.mediaStartTime}` : '')}
                    autoPlay muted loop playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )
              )}
              {isActive && activeScene.textOverlay &&
                sceneTime >= activeScene.textOverlay.startTime &&
                sceneTime <= (activeScene.textOverlay.startTime + activeScene.textOverlay.duration) && (
                  <div style={{
                    position: 'absolute', left: '10%', right: '10%', textAlign: 'center',
                    color: 'white', fontWeight: 800, fontSize: '20px',
                    backgroundColor: 'rgba(0,0,0,0.6)', padding: '8px', border: '4px solid black',
                    top: activeScene.textOverlay.position === 'top' ? '15%' : activeScene.textOverlay.position === 'middle' ? '50%' : '75%',
                    transform: activeScene.textOverlay.position === 'middle' ? 'translateY(-50%)' : 'none',
                  }}>
                    {activeScene.textOverlay.text}
                  </div>
                )}
            </div>
          );
        })}

        {/* Avatar overlay — only when enabled */}
        {avatarEnabled && (
        <div
          ref={avatarPreviewRef1}
          style={{
            position: 'absolute', width: '60px', height: '60px',
            borderRadius: '50%', border: '2px solid white', zIndex: 90,
            overflow: 'hidden', transition: 'transform 0.05s, box-shadow 0.05s',
            ...(reactionFacePosition === 'bottom-right' ? { bottom: '20px', right: '20px' } :
              reactionFacePosition === 'bottom-left' ? { bottom: '20px', left: '20px' } :
              reactionFacePosition === 'top-right' ? { top: '20px', right: '20px' } :
              { top: '20px', left: '20px' }),
          }}
        >
          <img
            src={characterSelect === 'custom' && reactionFaceFile ? URL.createObjectURL(reactionFaceFile) : `/${characterSelect}.png`}
            alt="Avatar"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        )}

        {/* Active subtitle overlay */}
        {result.voiceoverSubtitles?.map(sub => {
          if (previewTime >= sub.startTime && previewTime <= (sub.startTime + sub.duration)) {
            return (
              <div key={sub.id} style={{ position: 'absolute', bottom: '10%', left: '5%', right: '5%', textAlign: 'center', color: 'white', fontWeight: 800, fontSize: '18px', textShadow: '2px 2px 4px rgba(0,0,0,0.8)', zIndex: 100 }}>
                {sub.text}
              </div>
            );
          }
          return null;
        })}
      </div>
      </div>

      {/* Playback Controls */}
      <div style={{ flexShrink: 0, marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '360px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handlePlayPause}
            style={{ flex: 1, padding: '12px', backgroundColor: isPlaying ? '#ef4444' : '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {isPlaying ? '⏸ Pause Preview' : '▶ Play Preview'}
          </button>
          <button
            onClick={handleCutClip}
            title="Cut the active scene so it ends exactly at the red playhead line"
            style={{ padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            ✂️ Cut Clip
          </button>
        </div>
        <div style={{ fontSize: '12px', textAlign: 'center', color: '#666' }}>
          {previewTime.toFixed(1)}s / {audioDuration > 0 ? audioDuration.toFixed(1) : '0.0'}s
        </div>
      </div>
    </div>
  );
}

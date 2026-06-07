'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { StoryboardResponse, HistoryEntry, ClaudeSections, Scene } from '../../types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export function useVideoEditor() {
  const [concept, setConcept] = useState<string>('');
  const [sections, setSections] = useState<ClaudeSections>({
    fullScript: '',
    voiceoverOnly: '',
    textOverlays: '',
    masterTimeline: ''
  });
  const [isGeneratingSections, setIsGeneratingSections] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<StoryboardResponse | null>({
    scenes: [],
    voiceoverSubtitles: [],
    musicSuggestions: []
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const [localFiles, setLocalFiles] = useState<Record<string, File>>({});
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [bgMusicFile, setBgMusicFile] = useState<File | null>(null);
  const [selectedBgm, setSelectedBgm] = useState<string>('phonk');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [apiUsage, setApiUsage] = useState<number>(0);
  const [isRendering, setIsRendering] = useState(false);
  const [renderStatus, setRenderStatus] = useState<string>('');

  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);
  const [ttsVoice, setTtsVoice] = useState('en-US-GuyNeural');
  const [ttsSpeed, setTtsSpeed] = useState('+20%');

  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [bgmVolume, setBgmVolume] = useState<number>(0.1);
  const [reactionFaceFile, setReactionFaceFile] = useState<File | null>(null);
  const [reactionFacePosition, setReactionFacePosition] = useState<string>('top-right');
  const [characterSelect, setCharacterSelect] = useState<string>('commentator_1');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [previewTime, setPreviewTime] = useState<number>(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewTimerRef = useRef<number | null>(null);
  const audioContextRef = useRef<any>(null);
  const analyserRef = useRef<any>(null);
  const sourceNodeRef = useRef<any>(null);
  const avatarPreviewRef1 = useRef<HTMLDivElement | null>(null);
  const avatarPreviewRef2 = useRef<HTMLDivElement | null>(null);

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchModalSceneId, setSearchModalSceneId] = useState<string | null>(null);
  const [searchModalQuery, setSearchModalQuery] = useState('');
  const [searchModalResults, setSearchModalResults] = useState<any[]>([]);
  const [isSearchingYoutube, setIsSearchingYoutube] = useState(false);
  const [isDownloadingPreview, setIsDownloadingPreview] = useState(false);
  const [downloadingPreviewId, setDownloadingPreviewId] = useState<string | null>(null);
  const [trimmerVideo, setTrimmerVideo] = useState<any | null>(null);
  const [trimmerStartTime, setTrimmerStartTime] = useState<number>(0);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const getSceneTimings = (scenes: Scene[]) => {
    let accum = 0;
    return scenes.map((s, i) => {
      const start = accum;
      const end = start + s.duration;
      if (s.transitionNext && i < scenes.length - 1) {
        accum = end - 0.5;
      } else if (i < scenes.length - 1) {
        accum = end - 0.04;
      } else {
        accum = end;
      }
      return { scene: s, start, end, globalEnd: accum };
    });
  };

  // ─── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (previewTimerRef.current) cancelAnimationFrame(previewTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('video_automator_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
    const savedDate = localStorage.getItem('video_automator_usage_date');
    const today = new Date().toDateString();
    if (savedDate === today) {
      const usage = parseInt(localStorage.getItem('video_automator_usage_count') || '0', 10);
      setApiUsage(usage);
    } else {
      localStorage.setItem('video_automator_usage_date', today);
      localStorage.setItem('video_automator_usage_count', '0');
      setApiUsage(0);
    }
  }, []);

  useEffect(() => {
    if (result && activeHistoryId) {
      setHistory(prev => {
        const entryExists = prev.some(e => e.id === activeHistoryId);
        if (!entryExists) return prev;
        const updated = prev.map(entry =>
          entry.id === activeHistoryId ? { ...entry, result } : entry
        );
        localStorage.setItem('video_automator_history', JSON.stringify(updated));
        return updated;
      });
    }
  }, [result, activeHistoryId]);



  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(entry => entry.id !== id);
    setHistory(updated);
    localStorage.setItem('video_automator_history', JSON.stringify(updated));
    if (activeHistoryId === id) setActiveHistoryId(null);
  };

  const handleSwapMedia = async (sceneId: string, customQuery: string) => {
    if (!customQuery.trim()) return;
    try {
      const currentScene = result?.scenes.find(s => s.id === sceneId);
      const res = await fetch('/api/search-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: customQuery, currentUrl: currentScene?.mediaUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, mediaUrl: data.url, searchQuery: customQuery } : s),
          };
        });
      } else {
        alert('Failed to find a new image.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateDuration = (sceneId: string, newDuration: number) => {
    setResult(prev => {
      if (!prev) return prev;
      return { ...prev, scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, duration: newDuration } : s) };
    });
  };

  const handleRenderVideo = async () => {
    if (!result || !audioFile) return;
    setIsRendering(true);
    setRenderStatus('Uploading assets & rendering...');
    try {
      const formData = new FormData();
      formData.append('scenes', JSON.stringify(result.scenes));
      if (result.voiceoverSubtitles) {
        formData.append('voiceoverSubtitles', JSON.stringify(result.voiceoverSubtitles));
      }
      formData.append('voiceover', audioFile);
      if (selectedBgm && selectedBgm !== 'none') {
        formData.append('bgmKey', selectedBgm);
        formData.append('bgmVolume', bgmVolume.toString());
      }
      if (bgMusicFile && selectedBgm === 'custom') {
        formData.append('bgmFile', bgMusicFile);
      }
      formData.append('bgmKey', selectedBgm);
      formData.append('reactionFacePosition', reactionFacePosition);
      formData.append('characterSelect', characterSelect);
      if (reactionFaceFile && characterSelect === 'custom') {
        formData.append('reactionFaceFile', reactionFaceFile);
      }
      Object.entries(localFiles).forEach(([sceneId, file]) => {
        formData.append(`local_media_${sceneId}`, file);
      });
      const res = await fetch('/api/render', { method: 'POST', body: formData });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Rendering failed');
      }
      setRenderStatus('Downloading finished video...');
      const blob = await res.blob();
      saveAs(blob, 'final_short.mp4');
      setRenderStatus('');
    } catch (err: any) {
      console.error(err);
      alert(`Render Error: ${err.message}`);
      setRenderStatus('');
    } finally {
      setIsRendering(false);
    }
  };

  const handleDownloadAll = async () => {
    if (!result || !result.scenes) return;
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('video_assets');
      await Promise.all((result.scenes || []).map(async (scene, index) => {
        if (!scene.mediaUrl) return;
        const proxyUrl = `/api/download?url=${encodeURIComponent(scene.mediaUrl)}`;
        const res = await fetch(proxyUrl);
        const blob = await res.blob();
        let ext = 'jpg';
        if (scene.mediaUrl.includes('pexels') || scene.mediaUrl.endsWith('.mp4') || res.headers.get('content-type')?.includes('video')) {
          ext = 'mp4';
        } else if (scene.mediaUrl.endsWith('.png') || res.headers.get('content-type')?.includes('png')) {
          ext = 'png';
        }
        folder?.file(`scene_${index + 1}_${scene.assetType}.${ext}`, blob);
      }));
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'video_assets.zip');
    } catch (err) {
      console.error('Error zipping files:', err);
      alert('Failed to download all files.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleGenerateSections = async () => {
    if (!concept.trim()) return;
    setIsGeneratingSections(true);
    const newUsage = apiUsage + 1;
    setApiUsage(newUsage);
    localStorage.setItem('video_automator_usage_count', newUsage.toString());
    try {
      const res = await fetch('/api/generate-claude-sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept }),
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(`Error: ${errData.error || 'Failed to generate sections.'}`);
        return;
      }
      const data = await res.json() as ClaudeSections;
      setSections(data);
    } catch (error) {
      console.error('Error generating sections:', error);
    } finally {
      setIsGeneratingSections(false);
    }
  };

  const handleGenerateAssets = async () => {
    if (!sections.masterTimeline) return;
    setLoading(true);
    try {
      const res = await fetch('/api/parse-claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sections),
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(`Error: ${errData.error || 'Failed to parse assets.'}`);
        return;
      }
      const data = await res.json() as StoryboardResponse;
      setResult(data);
      const newEntryId = Date.now().toString();
      const newEntry: HistoryEntry = {
        id: newEntryId,
        timestamp: new Date().toLocaleString(),
        prompt: concept,
        sections,
        result: data,
      };
      const updatedHistory = [newEntry, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('video_automator_history', JSON.stringify(updatedHistory));
      setActiveHistoryId(newEntryId);
    } catch (error) {
      console.error('Error parsing storyboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTTS = async () => {
    if (!sections.voiceoverOnly.trim()) {
      alert('Please enter a voiceover script first!');
      return;
    }
    setIsGeneratingTTS(true);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sections.voiceoverOnly, voice: ttsVoice, rate: ttsSpeed }),
      });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      const byteCharacters = atob(data.audioBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const file = new File([byteArray], 'voiceover.mp3', { type: 'audio/mpeg' });
      setResult(prev => {
        if (!prev) return prev;
        return { ...prev, wordTimings: data.wordTimings };
      });
      setAudioFile(file);
      const url = URL.createObjectURL(file);
      const audio = new Audio(url);
      audio.onloadedmetadata = () => {
        setAudioDuration(audio.duration);
        URL.revokeObjectURL(url);
      };
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        setIsPlaying(false);
        setPreviewTime(0);
      }
      alert('Voiceover generated and applied successfully!');
    } catch (error) {
      console.error('Error generating TTS:', error);
      alert('Failed to generate TTS: ' + String(error));
    } finally {
      setIsGeneratingTTS(false);
    }
  };

  // ─── Return ─────────────────────────────────────────────────────────────────

  return {
    // State
    concept, setConcept,
    sections, setSections,
    isGeneratingSections,
    loading,
    result, setResult,
    isDownloading,
    localFiles, setLocalFiles,
    audioFile, setAudioFile,
    bgMusicFile, setBgMusicFile,
    selectedBgm, setSelectedBgm,
    history, setHistory,
    activeHistoryId, setActiveHistoryId,
    showHistory, setShowHistory,
    apiUsage,
    isRendering,
    renderStatus,
    isGeneratingTTS,
    ttsVoice, setTtsVoice,
    ttsSpeed, setTtsSpeed,
    audioDuration, setAudioDuration,
    bgmVolume, setBgmVolume,
    reactionFaceFile, setReactionFaceFile,
    reactionFacePosition, setReactionFacePosition,
    characterSelect, setCharacterSelect,
    isPlaying, setIsPlaying,
    previewTime, setPreviewTime,
    isSearchModalOpen, setIsSearchModalOpen,
    searchModalSceneId, setSearchModalSceneId,
    searchModalQuery, setSearchModalQuery,
    searchModalResults, setSearchModalResults,
    isSearchingYoutube, setIsSearchingYoutube,
    isDownloadingPreview, setIsDownloadingPreview,
    downloadingPreviewId, setDownloadingPreviewId,
    trimmerVideo, setTrimmerVideo,
    trimmerStartTime, setTrimmerStartTime,
    selectedSceneId, setSelectedSceneId,
    // Refs
    audioRef,
    bgmAudioRef,
    previewTimerRef,
    audioContextRef,
    analyserRef,
    sourceNodeRef,
    avatarPreviewRef1,
    avatarPreviewRef2,
    // Helpers
    getSceneTimings,
    // Handlers
    handleDeleteHistory,
    handleSwapMedia,
    updateDuration,
    handleRenderVideo,
    handleDownloadAll,
    handleGenerateSections,
    handleGenerateAssets,
    handleGenerateTTS,
  };
}

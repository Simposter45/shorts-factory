'use client';

import React from 'react';

interface AudioSettingsPanelProps {
  audioFile: File | null;
  setAudioFile: (f: File | null) => void;
  setAudioDuration: (d: number) => void;
  ttsVoice: string;
  setTtsVoice: (v: string) => void;
  ttsSpeed: string;
  setTtsSpeed: (s: string) => void;
  ttsReverb: boolean;
  setTtsReverb: (v: boolean) => void;
  voiceoverOnly: string;
  selectedBgm: string;
  setSelectedBgm: (v: string) => void;
  bgmVolume: number;
  setBgmVolume: (v: number) => void;
  bgMusicFile: File | null;
  setBgMusicFile: (f: File | null) => void;
  isGeneratingTTS: boolean;
  handleGenerateTTS: () => void;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  audioContextRef: React.MutableRefObject<any>;
  setIsPlaying: (v: boolean) => void;
  setPreviewTime: (v: number) => void;
  characterSelect?: string;
  setCharacterSelect?: (v: string) => void;
  reactionFaceFile?: File | null;
  setReactionFaceFile?: (f: File | null) => void;
  reactionFacePosition?: string;
  setReactionFacePosition?: (v: string) => void;
  avatarEnabled?: boolean;
  setAvatarEnabled?: (v: boolean) => void;
  avatarPreviewRef2?: React.RefObject<HTMLDivElement>;
}

export default function AudioSettingsPanel({
  audioFile, setAudioFile, setAudioDuration,
  ttsVoice, setTtsVoice,
  ttsSpeed, setTtsSpeed,
  ttsReverb, setTtsReverb,
  voiceoverOnly,
  selectedBgm, setSelectedBgm,
  bgmVolume, setBgmVolume,
  bgMusicFile, setBgMusicFile,
  isGeneratingTTS, handleGenerateTTS,
  audioRef, audioContextRef,
  setIsPlaying, setPreviewTime,
  characterSelect, setCharacterSelect,
  reactionFaceFile, setReactionFaceFile,
  reactionFacePosition, setReactionFacePosition,
  avatarEnabled, setAvatarEnabled,
  avatarPreviewRef2,
}: AudioSettingsPanelProps) {
  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAudioFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      const audio = new Audio(url);
      audio.onloadedmetadata = () => {
        setAudioDuration(audio.duration);
        URL.revokeObjectURL(url);
      };
    } else {
      setAudioDuration(0);
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setIsPlaying(false);
      setPreviewTime(0);
    }
  };

  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', color: 'white' }}>
      <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', color: 'white' }}>Audio Settings</h3>
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>

        {/* Voiceover */}
        <div style={{ flex: '1 1 300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600, display: 'block', color: 'white' }}>Voiceover Track (Required)</label>
          </div>

          <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', border: '1px dashed #ccc', marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#10b981' }}>✨ Auto-Generate Free Voiceover</h4>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <select
                value={ttsVoice}
                onChange={(e) => setTtsVoice(e.target.value)}
                style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="en-US-ChristopherNeural">Christopher (Pro Male)</option>
                <option value="en-US-AriaNeural">Aria (Pro Female)</option>
                <option value="en-US-AndrewNeural">Andrew (Heavy/Intense Male)</option>
                <option value="en-US-SteffanNeural">Steffan (Authoritative Male)</option>
                <option value="en-US-GuyNeural">Guy (Dramatic/Trailer Male)</option>
                <option value="en-US-JennyNeural">Jenny (Conversational Female)</option>
                <option value="en-GB-RyanNeural">Ryan (Dramatic British Male)</option>
                <option value="en-GB-SoniaNeural">Sonia (British Female)</option>
              </select>
              <select
                value={ttsSpeed}
                onChange={(e) => setTtsSpeed(e.target.value)}
                style={{ width: '80px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="-10%">0.9x</option>
                <option value="+0%">1.0x</option>
                <option value="+10%">1.1x</option>
                <option value="+20%">1.2x</option>
                <option value="+40%">+40% (Fast)</option>
              </select>
              <button
                onClick={handleGenerateTTS}
                disabled={isGeneratingTTS || !voiceoverOnly}
                style={{ padding: '8px 16px', background: isGeneratingTTS ? '#ccc' : '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: isGeneratingTTS ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
              >
                {isGeneratingTTS ? 'Generating...' : 'Generate AI Voice'}
              </button>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Uses Microsoft Edge Neural voices. Pulls text from your "Voiceover Only" script box.</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
            <div style={{ height: '1px', flex: 1, background: '#eee' }} />
            <span style={{ fontSize: '12px', color: '#999', fontWeight: 'bold' }}>OR UPLOAD MP3</span>
            <div style={{ height: '1px', flex: 1, background: '#eee' }} />
          </div>

          <input
            type="file"
            accept="audio/*"
            onChange={handleAudioFileChange}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
          />
        </div>

        {/* BGM */}
        <div style={{ flex: '1 1 300px' }}>
          <label style={{ fontSize: '14px', fontWeight: 600, display: 'block', marginBottom: '8px', color: 'white' }}>Background Music (Optional)</label>
          <select
            value={selectedBgm}
            onChange={(e) => {
              setSelectedBgm(e.target.value);
              if (e.target.value !== 'custom') setBgMusicFile(null);
            }}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%', marginBottom: '8px' }}
          >
            <option value="none">None</option>
            <option value="hard_phonk">Hard Phonk (Aggressive Tunetank)</option>
            <option value="phonk">Phonk / Aggressive Drift (Viral)</option>
            <option value="epic_cinematic">Epic Cinematic / Hans Zimmer</option>
            <option value="lofi_chill">Lo-Fi Chillhop</option>
            <option value="synthwave">Synthwave / Cyberpunk</option>
            <option value="creepy_ambient">Creepy / Dark Ambient</option>
            <option value="emotional_piano">Emotional / Inspirational Piano</option>
            <option value="upbeat_tech">Upbeat Corporate Tech</option>
            <option value="comedy_mischief">Sneaky / Comedy / Mischief</option>
            <option value="custom">Upload Custom MP3...</option>
          </select>

          {selectedBgm === 'custom' && (
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setBgMusicFile(e.target.files?.[0] || null)}
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
            />
          )}

          <div style={{ marginTop: '12px', padding: '12px', background: '#f8f9fa', borderRadius: '8px', fontSize: '12px', color: '#666' }}>
            <strong>✨ Auto-BGM</strong>
            <p style={{ margin: '4px 0 12px 0' }}>The AI has analyzed your script and auto-selected the best viral track style.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 'bold' }}>Volume:</span>
              <input
                type="range"
                min="0" max="1" step="0.05"
                value={bgmVolume}
                onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ fontWeight: 'bold', width: '30px' }}>{Math.round(bgmVolume * 100)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

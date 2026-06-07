'use client';

import React from 'react';
import { useVideoEditor } from './hooks/useVideoEditor';
import InputSidebar from './components/InputSidebar';
import VideoPreview from './components/VideoPreview';
import AudioSettingsPanel from './components/AudioSettingsPanel';
import CharacterPanel from './components/CharacterPanel';
import SceneMediaEditor from './components/SceneMediaEditor';
import SubtitlesEditor from './components/SubtitlesEditor';
import TimelinePanel from './components/TimelinePanel';
import SearchSwapModal from './components/SearchSwapModal';

export default function VideoAutomatorClient() {
  const editor = useVideoEditor();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div
      className="container"
      style={editor.result ? { maxWidth: '100%', margin: 0, padding: 0, height: '100vh', display: 'flex', flexDirection: 'column', background: '#0f172a', color: 'white', overflow: 'hidden' } : {}}
    >
      {/* Global styles */}
      {editor.result && <style>{`body { margin: 0; padding: 0; overflow: hidden; background: #0f172a; } * { box-sizing: border-box; }`}</style>}
      <style>{`
        .container {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 20px;
          font-family: system-ui, -apple-system, sans-serif;
          color: #333;
        }
        .header-title { font-size: 28px; font-weight: 700; margin-bottom: 8px; color: #111; }
        .header-sub { font-size: 14px; color: #666; margin-bottom: 24px; line-height: 1.5; }
        .input-area {
          width: 100%; height: 120px; padding: 12px;
          border: 1px solid #ccc; border-radius: 6px;
          font-size: 16px; margin-bottom: 16px;
          resize: vertical; box-sizing: border-box; font-family: inherit;
        }
        .btn {
          background-color: #0070f3; color: white; border: none;
          padding: 12px 24px; border-radius: 6px;
          font-size: 16px; font-weight: 600; cursor: pointer; transition: background 0.2s;
        }
        .btn:hover { background-color: #005bb5; }
        .btn:disabled { background-color: #a0c4ff; cursor: not-allowed; }
        @keyframes avatarPulse {
          0%   { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); transform: scale(1); }
          50%  { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); transform: scale(1.05); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); transform: scale(1); }
        }
        .avatar-pulse { animation: avatarPulse 0.6s infinite ease-in-out; }
      `}</style>

      {/* ── Left Sidebar ── */}
      <InputSidebar
        concept={editor.concept}
        setConcept={editor.setConcept}
        sections={editor.sections}
        setSections={editor.setSections}
        history={editor.history}
        showHistory={editor.showHistory}
        setShowHistory={editor.setShowHistory}
        apiUsage={editor.apiUsage}
        isGeneratingSections={editor.isGeneratingSections}
        loading={editor.loading}
        activeHistoryId={editor.activeHistoryId}
        setActiveHistoryId={editor.setActiveHistoryId}
        setResult={editor.setResult}
        handleDeleteHistory={editor.handleDeleteHistory}
        handleGenerateSections={editor.handleGenerateSections}
        handleGenerateAssets={() => {
          editor.handleGenerateAssets();
          setIsSidebarOpen(false);
        }}
        hasResult={!!editor.result}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* ── Editor Area (only when result exists) ── */}
      {editor.result && (
        <div className="result-section" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, height: '100%', overflow: 'hidden' }}>

          {/* Top bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, padding: '12px 16px', borderBottom: '1px solid #1e293b', background: '#0f172a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button 
                onClick={() => setIsSidebarOpen(true)}
                style={{ padding: '8px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ☰ Open Generator
              </button>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'white' }}>🎬 Video Editor</h2>
            </div>
            <button
              onClick={editor.handleDownloadAll}
              disabled={editor.isDownloading}
              style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: editor.isDownloading ? 'not-allowed' : 'pointer', opacity: editor.isDownloading ? 0.7 : 1 }}
            >
              {editor.isDownloading ? 'Zipping...' : '⭳ Download All (ZIP)'}
            </button>
          </div>

          {/* Main body: preview | controls */}
          <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

            {/* LEFT: 9:16 preview */}
            <VideoPreview
              result={editor.result}
              previewTime={editor.previewTime}
              setPreviewTime={editor.setPreviewTime}
              isPlaying={editor.isPlaying}
              setIsPlaying={editor.setIsPlaying}
              audioDuration={editor.audioDuration}
              audioFile={editor.audioFile}
              setAudioFile={editor.setAudioFile}
              bgmVolume={editor.bgmVolume}
              selectedBgm={editor.selectedBgm}
              bgMusicFile={editor.bgMusicFile}
              reactionFacePosition={editor.reactionFacePosition}
              characterSelect={editor.characterSelect}
              reactionFaceFile={editor.reactionFaceFile}
              setResult={editor.setResult}
              audioRef={editor.audioRef}
              bgmAudioRef={editor.bgmAudioRef}
              previewTimerRef={editor.previewTimerRef}
              audioContextRef={editor.audioContextRef}
              analyserRef={editor.analyserRef}
              sourceNodeRef={editor.sourceNodeRef}
              avatarPreviewRef1={editor.avatarPreviewRef1}
              avatarPreviewRef2={editor.avatarPreviewRef2}
              getSceneTimings={editor.getSceneTimings}
            />

            {/* RIGHT: scrollable settings + pinned timeline */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0f172a' }}>

              {/* Scrollable control cards */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '16px', gap: '16px' }}>
                {/* TOP: Scene Media Editor (Full Width) */}
                <div style={{ width: '100%' }}>
                  <SceneMediaEditor
                    result={editor.result}
                    selectedSceneId={editor.selectedSceneId}
                    previewTime={editor.previewTime}
                    setResult={editor.setResult}
                    setSearchModalSceneId={editor.setSearchModalSceneId}
                    setSearchModalQuery={editor.setSearchModalQuery}
                    setIsSearchModalOpen={editor.setIsSearchModalOpen}
                    setSearchModalResults={editor.setSearchModalResults}
                    setTrimmerVideo={editor.setTrimmerVideo}
                    setTrimmerStartTime={editor.setTrimmerStartTime}
                    updateDuration={editor.updateDuration}
                    getSceneTimings={editor.getSceneTimings}
                    handleSwapMedia={editor.handleSwapMedia}
                  />
                </div>

                {/* BOTTOM: Other Cards (Dynamic Grid) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
                  <AudioSettingsPanel
                    audioFile={editor.audioFile}
                    setAudioFile={editor.setAudioFile}
                    setAudioDuration={editor.setAudioDuration}
                    ttsVoice={editor.ttsVoice}
                    setTtsVoice={editor.setTtsVoice}
                    ttsSpeed={editor.ttsSpeed}
                    setTtsSpeed={editor.setTtsSpeed}
                    voiceoverOnly={editor.sections.voiceoverOnly}
                    selectedBgm={editor.selectedBgm}
                    setSelectedBgm={editor.setSelectedBgm}
                    bgmVolume={editor.bgmVolume}
                    setBgmVolume={editor.setBgmVolume}
                    bgMusicFile={editor.bgMusicFile}
                    setBgMusicFile={editor.setBgMusicFile}
                    isGeneratingTTS={editor.isGeneratingTTS}
                    handleGenerateTTS={editor.handleGenerateTTS}
                    audioRef={editor.audioRef}
                    audioContextRef={editor.audioContextRef}
                    setIsPlaying={editor.setIsPlaying}
                    setPreviewTime={editor.setPreviewTime}
                  />
                  <CharacterPanel
                    characterSelect={editor.characterSelect}
                    setCharacterSelect={editor.setCharacterSelect}
                    reactionFaceFile={editor.reactionFaceFile}
                    setReactionFaceFile={editor.setReactionFaceFile}
                    reactionFacePosition={editor.reactionFacePosition}
                    setReactionFacePosition={editor.setReactionFacePosition}
                    avatarPreviewRef2={editor.avatarPreviewRef2}
                  />
                  <SubtitlesEditor
                    result={editor.result}
                    audioDuration={editor.audioDuration}
                    setResult={editor.setResult}
                  />
                </div>
              </div>

              {/* Timeline pinned at bottom of right column */}
              <TimelinePanel
                result={editor.result}
                previewTime={editor.previewTime}
                setPreviewTime={editor.setPreviewTime}
                audioDuration={editor.audioDuration}
                audioFile={editor.audioFile}
                selectedBgm={editor.selectedBgm}
                bgMusicFile={editor.bgMusicFile}
                selectedSceneId={editor.selectedSceneId}
                setSelectedSceneId={editor.setSelectedSceneId}
                isPlaying={editor.isPlaying}
                setIsPlaying={editor.setIsPlaying}
                setResult={editor.setResult}
                audioRef={editor.audioRef}
                previewTimerRef={editor.previewTimerRef}
                getSceneTimings={editor.getSceneTimings}
              />

              {/* Render button */}
              <div style={{ padding: '12px 16px', flexShrink: 0, background: '#0f172a', borderTop: '1px solid #1e293b' }}>
                <button
                  onClick={editor.handleRenderVideo}
                  disabled={editor.isRendering || !editor.audioFile}
                  style={{
                    width: '100%', padding: '14px',
                    backgroundColor: (!editor.audioFile || editor.isRendering) ? '#334155' : '#ef4444',
                    color: 'white', border: 'none', borderRadius: '8px',
                    fontSize: '16px', fontWeight: 700,
                    cursor: (!editor.audioFile || editor.isRendering) ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  {editor.isRendering ? `Rendering... ${editor.renderStatus}` : '🎬 Render Final Video with Zoom & Auto-Captions'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Swap Modal */}
      <SearchSwapModal
        isSearchModalOpen={editor.isSearchModalOpen}
        setIsSearchModalOpen={editor.setIsSearchModalOpen}
        searchModalQuery={editor.searchModalQuery}
        setSearchModalQuery={editor.setSearchModalQuery}
        searchModalResults={editor.searchModalResults}
        setSearchModalResults={editor.setSearchModalResults}
        isSearchingYoutube={editor.isSearchingYoutube}
        setIsSearchingYoutube={editor.setIsSearchingYoutube}
        trimmerVideo={editor.trimmerVideo}
        setTrimmerVideo={editor.setTrimmerVideo}
        trimmerStartTime={editor.trimmerStartTime}
        setTrimmerStartTime={editor.setTrimmerStartTime}
        searchModalSceneId={editor.searchModalSceneId}
        isDownloadingPreview={editor.isDownloadingPreview}
        setIsDownloadingPreview={editor.setIsDownloadingPreview}
        setDownloadingPreviewId={editor.setDownloadingPreviewId}
        result={editor.result}
        setResult={editor.setResult}
      />
    </div>
  );
}

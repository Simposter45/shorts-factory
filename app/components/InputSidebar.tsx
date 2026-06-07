'use client';

import React from 'react';
import type { ClaudeSections, HistoryEntry } from '../../types';

interface InputSidebarProps {
  concept: string;
  setConcept: (v: string) => void;
  sections: ClaudeSections;
  setSections: (v: ClaudeSections) => void;
  history: HistoryEntry[];
  showHistory: boolean;
  setShowHistory: (v: boolean) => void;
  apiUsage: number;
  isGeneratingSections: boolean;
  loading: boolean;
  activeHistoryId: string | null;
  setActiveHistoryId: (v: string | null) => void;
  setResult: (v: any) => void;
  handleDeleteHistory: (id: string, e: React.MouseEvent) => void;
  handleGenerateSections: () => void;
  handleGenerateAssets: () => void;
  hasResult: boolean;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (v: boolean) => void;
}

export default function InputSidebar({
  concept, setConcept,
  sections, setSections,
  history, showHistory, setShowHistory,
  apiUsage, isGeneratingSections, loading,
  activeHistoryId, setActiveHistoryId,
  setResult,
  handleDeleteHistory,
  handleGenerateSections,
  handleGenerateAssets,
  hasResult,
  isSidebarOpen,
  setIsSidebarOpen,
}: InputSidebarProps) {
  if (hasResult && !isSidebarOpen) return null;

  const containerStyle: React.CSSProperties = hasResult
    ? {
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: '400px', backgroundColor: '#f8f9fa',
        padding: '24px', zIndex: 1000,
        boxShadow: '4px 0 15px rgba(0,0,0,0.5)', overflowY: 'auto',
        color: '#333'
      }
    : {};

  return (
    <>
      {hasResult && isSidebarOpen && (
        <div 
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999 }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <div
        className="input-sidebar"
        style={containerStyle}
      >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h1 className="header-title" style={{ marginBottom: 0 }}>Storyboard &amp; Asset Generator</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          {hasResult && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
            >
              Close
            </button>
          )}
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{ padding: '6px 12px', background: '#eee', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
          >
            {showHistory ? 'Hide History' : `View History (${history.length})`}
          </button>
        </div>
      </div>
      <p className="header-sub">
        Phase 1: Paste your prompt below. The system will break it down into scenes, fetch relevant proxy assets, and recommend background tracks to layer under your ElevenLabs voiceover.
      </p>

      {/* History Panel */}
      {showHistory && history.length > 0 && (
        <div style={{ background: '#f9f9f9', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #ddd' }}>
          <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '16px' }}>Past Generations</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
            {history.map((entry) => (
              <div
                key={entry.id}
                onClick={() => {
                  if (entry.sections) setSections(entry.sections);
                  if (entry.prompt) setConcept(entry.prompt);
                  setResult(entry.result);
                  setActiveHistoryId(entry.id);
                  setShowHistory(false);
                }}
                style={{ background: '#fff', padding: '12px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666', paddingRight: '24px' }}>
                  <span>{entry.timestamp}</span>
                  <span>{(entry.result?.scenes || []).length} Scenes</span>
                </div>
                <div style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '24px' }}>
                  <strong>Prompt:</strong>{' '}
                  {(() => {
                    if (entry.prompt?.trim()) return entry.prompt;
                    if (entry.sections?.voiceoverOnly?.trim()) {
                      const t = entry.sections.voiceoverOnly.trim();
                      return t.length > 70 ? t.substring(0, 70) + '...' : t;
                    }
                    if (entry.sections?.masterTimeline?.trim()) {
                      const t = entry.sections.masterTimeline.trim();
                      return t.length > 70 ? t.substring(0, 70) + '...' : t;
                    }
                    return 'Manual Sections Entry';
                  })()}
                </div>
                <button
                  onClick={(e) => handleDeleteHistory(entry.id, e)}
                  title="Delete this history entry"
                  style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', color: '#ff4d4f', cursor: 'pointer', fontSize: '14px', padding: '4px', lineHeight: 1 }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gemini Auto-fill */}
      <div style={{ background: '#f0f4f8', padding: '20px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #cce0ff' }}>
        <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '18px' }}>⚡ Generate with Gemini (Auto-Fill)</h3>
        <p style={{ fontSize: '14px', color: '#555', margin: '0 0 16px 0' }}>Type a concept and let Gemini auto-generate the 6 Director's Cut sections below (Uses 1 API request).</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            className="input-area"
            style={{ height: '48px', marginBottom: 0, flex: 1 }}
            placeholder="e.g., A 30s video about Messi's world cup victory..."
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
          />
          <button className="btn" onClick={handleGenerateSections} disabled={isGeneratingSections}>
            {isGeneratingSections ? 'Generating...' : 'Auto-Fill Sections'}
          </button>
        </div>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '8px', fontWeight: 500 }}>
          API Usage Today:{' '}
          <span style={{ color: apiUsage > 14 ? '#ef4444' : '#10b981', fontWeight: 700 }}>{apiUsage}</span> / 20 Requests
        </div>
      </div>

      {/* Script Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '18px' }}>📝 Director's Cut Script Sections</h3>
        <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>Paste your Claude output directly into these fields to bypass Gemini API quotas.</p>

        <div>
          <label style={{ fontWeight: 600, fontSize: '14px', display: 'block', marginBottom: '4px' }}>Voiceover Only</label>
          <textarea
            className="input-area"
            style={{ height: '120px' }}
            value={sections.voiceoverOnly}
            onChange={(e) => setSections({ ...sections, voiceoverOnly: e.target.value })}
          />
        </div>
        <div>
          <label style={{ fontWeight: 600, fontSize: '14px', display: 'block', marginBottom: '4px' }}>Master Timeline</label>
          <textarea
            className="input-area"
            style={{ height: '240px' }}
            placeholder={`0:00–0:04 | TYPE: VIDEO | SOURCE: Pexels | Search: "soccer player injury medical staff" | Voiceover: The World Cup hasn't even started...`}
            value={sections.masterTimeline}
            onChange={(e) => setSections({ ...sections, masterTimeline: e.target.value })}
          />
        </div>
        <div>
          <label style={{ fontWeight: 600, fontSize: '14px', display: 'block', marginBottom: '4px' }}>Text Overlays (Optional)</label>
          <textarea
            className="input-area"
            style={{ height: '80px' }}
            placeholder="at 0:13 (4 seconds): GERMANY: 8 WINS IN A ROW"
            value={sections.textOverlays || ''}
            onChange={(e) => setSections({ ...sections, textOverlays: e.target.value })}
          />
        </div>
      </div>

      {/* Generate Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
        <button
          className="btn"
          onClick={handleGenerateAssets}
          disabled={loading}
          style={{ backgroundColor: '#ef4444', fontSize: '18px', padding: '16px 32px' }}
        >
          {loading ? 'Building Timeline...' : '▶ Generate Assets & Timeline'}
        </button>
      </div>
      </div>
    </>
  );
}

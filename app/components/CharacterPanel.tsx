'use client';

import React from 'react';

interface CharacterPanelProps {
  characterSelect: string;
  setCharacterSelect: (v: string) => void;
  reactionFaceFile: File | null;
  setReactionFaceFile: (f: File | null) => void;
  reactionFacePosition: string;
  setReactionFacePosition: (v: string) => void;
  avatarEnabled: boolean;
  setAvatarEnabled: (v: boolean) => void;
  avatarPreviewRef2: React.RefObject<HTMLDivElement>;
}

export default function CharacterPanel({
  characterSelect, setCharacterSelect,
  reactionFaceFile, setReactionFaceFile,
  reactionFacePosition, setReactionFacePosition,
  avatarEnabled, setAvatarEnabled,
  avatarPreviewRef2,
}: CharacterPanelProps) {
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', color: 'white' }}>
      {/* Header with toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', color: 'white' }}>Character &amp; Persona Settings</h3>
        {/* Toggle Switch */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
          <span style={{ fontSize: '13px', color: avatarEnabled ? '#10b981' : '#94a3b8', fontWeight: 600 }}>
            {avatarEnabled ? 'Avatar ON' : 'Avatar OFF'}
          </span>
          <div
            onClick={() => setAvatarEnabled(!avatarEnabled)}
            style={{
              position: 'relative', width: '44px', height: '24px',
              background: avatarEnabled ? '#10b981' : '#475569',
              borderRadius: '12px', cursor: 'pointer',
              transition: 'background 0.2s ease',
              flexShrink: 0,
            }}
          >
            <div style={{
              position: 'absolute', top: '3px',
              left: avatarEnabled ? '23px' : '3px',
              width: '18px', height: '18px',
              background: 'white', borderRadius: '50%',
              transition: 'left 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }} />
          </div>
        </label>
      </div>

      {/* Settings — only shown when avatar is enabled */}
      {avatarEnabled && (
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>

          {/* Persona selector */}
          <div style={{ flex: '1 1 300px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600, display: 'block', marginBottom: '8px', color: 'white' }}>Avatar Persona</label>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div
                ref={avatarPreviewRef2}
                style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #ccc', flexShrink: 0, backgroundColor: '#f0f0f0', transition: 'transform 0.05s, box-shadow 0.05s' }}
              >
                <img
                  src={characterSelect === 'custom' && reactionFaceFile ? URL.createObjectURL(reactionFaceFile) : `/${characterSelect}.png`}
                  alt="Avatar Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <select
                  value={characterSelect}
                  onChange={(e) => setCharacterSelect(e.target.value)}
                  style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%', marginBottom: '8px' }}
                >
                  <option value="commentator_1">Character A: The Pro</option>
                  <option value="commentator_2">Character B: The Analyst</option>
                  <option value="commentator_3">Character C: The Fan</option>
                  <option value="custom">Custom Upload...</option>
                </select>
                {characterSelect === 'custom' && (
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => setReactionFaceFile(e.target.files?.[0] || null)}
                    style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%', marginBottom: '8px' }}
                  />
                )}
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>The avatar will automatically pulse/talk when the voiceover is playing.</p>
              </div>
            </div>
          </div>

          {/* Position selector */}
          <div style={{ flex: '1 1 300px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Avatar Position</label>
            <select
              value={reactionFacePosition}
              onChange={(e) => setReactionFacePosition(e.target.value)}
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
            >
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="top-right">Top Right</option>
              <option value="top-left">Top Left</option>
            </select>
          </div>
        </div>
      )}

      {!avatarEnabled && (
        <p style={{ margin: 0, fontSize: '13px', color: '#64748b', textAlign: 'center', padding: '12px 0' }}>
          Avatar is disabled — no character overlay will appear in the final video.
        </p>
      )}
    </div>
  );
}

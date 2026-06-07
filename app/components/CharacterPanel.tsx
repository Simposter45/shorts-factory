'use client';

import React from 'react';

interface CharacterPanelProps {
  characterSelect: string;
  setCharacterSelect: (v: string) => void;
  reactionFaceFile: File | null;
  setReactionFaceFile: (f: File | null) => void;
  reactionFacePosition: string;
  setReactionFacePosition: (v: string) => void;
  avatarPreviewRef2: React.RefObject<HTMLDivElement>;
}

export default function CharacterPanel({
  characterSelect, setCharacterSelect,
  reactionFaceFile, setReactionFaceFile,
  reactionFacePosition, setReactionFacePosition,
  avatarPreviewRef2,
}: CharacterPanelProps) {
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', color: 'white' }}>
      <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', color: 'white' }}>Character &amp; Persona Settings</h3>
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
    </div>
  );
}

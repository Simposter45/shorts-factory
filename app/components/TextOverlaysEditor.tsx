'use client';

import React from 'react';
import type { StoryboardResponse } from '../../types';

interface TextOverlaysEditorProps {
  result: StoryboardResponse;
  setResult: React.Dispatch<React.SetStateAction<StoryboardResponse | null>>;
}

export default function TextOverlaysEditor({ result, setResult }: TextOverlaysEditorProps) {
  if (!result || !result.scenes || result.scenes.length === 0) return null;

  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', color: 'white', height: '100%', maxHeight: '400px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '18px' }}>Text Overlays</h3>
        <button
          onClick={() => {
            if (confirm('Are you sure you want to delete all text overlays?')) {
              setResult(prev => {
                if (!prev) return prev;
                return { ...prev, scenes: prev.scenes.map(s => ({ ...s, textOverlay: undefined })) };
              });
            }
          }}
          style={{ padding: '6px 12px', background: '#450a0a', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
        >
          🗑️ Delete All
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {result.scenes.map((scene, index) => (
          <div key={scene.id} style={{ display: 'flex', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid #334155', flexShrink: 0 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '14px', color: '#8b5cf6' }}>Scene {index + 1} Overlay</span>
                
                {!scene.textOverlay ? (
                  <button
                    onClick={() => {
                      setResult(prev => {
                        if (!prev) return prev;
                        return { ...prev, scenes: prev.scenes.map(s => s.id === scene.id ? { ...s, textOverlay: { text: 'NEW TEXT', startTime: 0, duration: s.duration, position: 'bottom' } } : s) };
                      });
                    }}
                    style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                  >
                    + Add
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                      value={scene.textOverlay.position || 'bottom'}
                      onChange={(e) => {
                        setResult(prev => {
                          if (!prev) return prev;
                          return { ...prev, scenes: prev.scenes.map(s => s.id === scene.id ? { ...s, textOverlay: { ...s.textOverlay!, position: e.target.value as any } } : s) };
                        });
                      }}
                      style={{ padding: '2px 4px', border: '1px solid #334155', background: '#0f172a', color: 'white', borderRadius: '4px', fontSize: '12px' }}
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
                      style={{ background: '#450a0a', color: '#ef4444', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {scene.textOverlay && (
                <textarea
                  value={scene.textOverlay.text}
                  onChange={(e) => {
                    setResult(prev => {
                      if (!prev) return prev;
                      return { ...prev, scenes: prev.scenes.map(s => s.id === scene.id ? { ...s, textOverlay: { ...s.textOverlay!, text: e.target.value } } : s) };
                    });
                  }}
                  style={{ width: '100%', height: '60px', padding: '8px', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: '14px', resize: 'vertical' }}
                  placeholder="Enter text overlay here..."
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

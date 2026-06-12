'use client';

import React from 'react';
import type { StoryboardResponse } from '../../types';

interface SubtitlesEditorProps {
  result: StoryboardResponse;
  audioDuration: number;
  setResult: React.Dispatch<React.SetStateAction<StoryboardResponse | null>>;
  voiceoverScript?: string;
}

export default function SubtitlesEditor({ result, audioDuration, setResult, voiceoverScript }: SubtitlesEditorProps) {
  const handleRebuildFromScript = () => {
    if (!voiceoverScript || !voiceoverScript.trim()) {
      alert("No voiceover script available to build subtitles from.");
      return;
    }
    
    // Clean out SSML and XML comments
    let cleaned = voiceoverScript
      .replace(/<!--[\s\S]*?-->/g, '') // remove comments
      .replace(/<\/?speak[^>]*>/gi, ''); // remove <speak> tags
      
    // Split by break tags, double newlines, or sentences
    // For simplicity, let's split by break tags and line breaks to preserve user's structure
    const segments = cleaned.split(/<break[^>]*>|\n\n|\n/i);
    
    const newSubs = segments
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map((text, i) => ({
        id: `sub_rebuilt_${Date.now()}_${i}`,
        text: text,
        startTime: i * 2, // arbitrary starting spacing, users will click Auto-Sync right after!
        duration: 2
      }));

    if (newSubs.length === 0) {
      alert("Could not extract any spoken text from the script.");
      return;
    }

    if (confirm("This will overwrite all existing subtitle blocks with fresh ones extracted from the Voiceover Script. Are you sure?")) {
      setResult(prev => {
        if (!prev) return prev;
        return { ...prev, voiceoverSubtitles: newSubs };
      });
    }
  };

  const handleAutoSync = () => {
    setResult(prev => {
      if (!prev || !prev.voiceoverSubtitles || prev.voiceoverSubtitles.length === 0) return prev;
      if (audioDuration <= 0) {
        alert('Please generate or upload an audio track first to auto-sync.');
        return prev;
      }

      // If we have precise word timings from Edge TTS
      if (prev.wordTimings && prev.wordTimings.length > 0) {
        // 1. Reconstruct the full text as an absolute coordinate system
        const subCoordinates: { start: number; end: number }[] = [];
        let currentTextIndex = 0;
        const fullText = prev.voiceoverSubtitles.map(s => {
           const start = currentTextIndex;
           const end = currentTextIndex + s.text.length;
           currentTextIndex = end + 1; // +1 for the space separator
           subCoordinates.push({ start, end });
           return s.text;
        }).join(' ');

        // 2. Map each TTS timing to its character index in the full text
        const lowerFull = fullText.toLowerCase();
        let searchIndex = 0;
        
        const mappedTimings = prev.wordTimings.map(t => {
           const coreWord = t.part.replace(/[^\w]/g, '').toLowerCase();
           if (!coreWord) return { ...t, textIndex: searchIndex };

           let idx = lowerFull.indexOf(coreWord, searchIndex);
           
           // Reject match if it skipped too far (prevents false positive jumps if a word repeats later)
           if (idx !== -1 && idx - searchIndex > 60) {
              idx = -1;
           }

           if (idx === -1) {
              idx = searchIndex; // Stay anchored if word heavily modified by TTS
           } else {
              searchIndex = idx + coreWord.length;
           }
           
           return { ...t, textIndex: idx };
        });

        // 3. Assign times to subtitles based on coordinate ranges
        let lastEndTime = 0;
        const syncedSubs = prev.voiceoverSubtitles.map((sub, i) => {
           const coords = subCoordinates[i];
           const matchingTimings = mappedTimings.filter(t => t.textIndex >= coords.start && t.textIndex < coords.end);
           
           let startTime = lastEndTime;
           let endTime = lastEndTime + 0.1;
           
           if (matchingTimings.length > 0) {
              startTime = matchingTimings[0].start / 1000;
              endTime = matchingTimings[matchingTimings.length - 1].end / 1000;
           }
           
           // Enforce monotonicity (subtitles can't go backwards or overlap)
           if (startTime < lastEndTime) startTime = lastEndTime;
           if (endTime <= startTime) endTime = startTime + 0.1;
           
           lastEndTime = endTime;

           return {
             ...sub,
             startTime: parseFloat(startTime.toFixed(2)),
             duration: parseFloat((endTime - startTime).toFixed(2))
           };
        });
        
        return { ...prev, voiceoverSubtitles: syncedSubs };
      }

      // Fallback: character-count estimation
      const totalChars = prev.voiceoverSubtitles.reduce((sum, sub) => sum + sub.text.replace(/\s+/g, '').length, 0);
      let currentTime = 0;
      const syncedSubs = prev.voiceoverSubtitles.map(sub => {
        const chars = sub.text.replace(/\s+/g, '').length;
        const duration = Math.max(0.5, (chars / totalChars) * audioDuration);
        const subObj = { ...sub, startTime: parseFloat(currentTime.toFixed(2)), duration: parseFloat(duration.toFixed(2)) };
        currentTime += duration;
        return subObj;
      });
      return { ...prev, voiceoverSubtitles: syncedSubs };
    });
  };

  const handleAddSubtitle = () => {
    setResult(prev => {
      if (!prev) return prev;
      const newSub = {
        id: `sub_${Date.now()}_${Math.random()}`,
        text: 'New Subtitle',
        startTime: prev.voiceoverSubtitles?.length
          ? (prev.voiceoverSubtitles[prev.voiceoverSubtitles.length - 1].startTime +
             prev.voiceoverSubtitles[prev.voiceoverSubtitles.length - 1].duration)
          : 0,
        duration: 3,
      };
      return { ...prev, voiceoverSubtitles: [...(prev.voiceoverSubtitles || []), newSub] };
    });
  };

  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', height: '100%', maxHeight: '400px', overflowY: 'auto', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '18px' }}>Voiceover Subtitles Editor</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleRebuildFromScript}
            style={{ padding: '6px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
            title="Re-extract subtitles from the Voiceover Script text"
          >
            🔄 Rebuild from Script
          </button>
          <button
            onClick={handleAutoSync}
            style={{ padding: '6px 12px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
            title="Automatically adjust start times based on the TTS generated word timings"
          >
            ⚡ Perfect Auto-Sync
          </button>
          <button
            onClick={handleAddSubtitle}
            style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
          >
            + Add Subtitle
          </button>
        </div>
      </div>

      {result.voiceoverSubtitles?.map((sub, index) => (
        <div key={sub.id} style={{ display: 'flex', gap: '16px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #334155', flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '14px', color: '#8b5cf6' }}>Subtitle Block {index + 1}</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>Start Time:</label>
                <input
                  type="number"
                  value={sub.startTime}
                  onChange={(e) => {
                    let val = parseFloat(e.target.value);
                    if (isNaN(val) || val < 0) val = 0;
                    setResult(prev => {
                      if (!prev) return prev;
                      return { ...prev, voiceoverSubtitles: prev.voiceoverSubtitles?.map(s => s.id === sub.id ? { ...s, startTime: val } : s) };
                    });
                  }}
                  style={{ width: '60px', padding: '2px 4px', border: '1px solid #334155', background: '#0f172a', color: 'white', borderRadius: '4px', fontSize: '12px' }}
                  min="0" step="0.5"
                />s
                <label style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '8px' }}>Duration:</label>
                <input
                  type="number"
                  value={sub.duration}
                  onChange={(e) => {
                    let val = parseFloat(e.target.value);
                    if (isNaN(val) || val <= 0) val = 1;
                    setResult(prev => {
                      if (!prev || !prev.voiceoverSubtitles) return prev;
                      const diff = val - sub.duration;
                      let foundCurrent = false;
                      const newSubs = prev.voiceoverSubtitles.map(s => {
                        if (s.id === sub.id) { foundCurrent = true; return { ...s, duration: val }; }
                        if (foundCurrent) return { ...s, startTime: Math.max(0, s.startTime + diff) };
                        return s;
                      });
                      return { ...prev, voiceoverSubtitles: newSubs };
                    });
                  }}
                  style={{ width: '60px', padding: '2px 4px', border: '1px solid #334155', background: '#0f172a', color: 'white', borderRadius: '4px', fontSize: '12px' }}
                  min="0.5" step="0.5"
                />s
                <button
                  onClick={() => {
                    setResult(prev => {
                      if (!prev) return prev;
                      return { ...prev, voiceoverSubtitles: prev.voiceoverSubtitles?.filter(s => s.id !== sub.id) };
                    });
                  }}
                  style={{ marginLeft: '8px', background: '#450a0a', color: '#ef4444', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
            </div>
            <textarea
              value={sub.text}
              onChange={(e) => {
                setResult(prev => {
                  if (!prev) return prev;
                  return { ...prev, voiceoverSubtitles: prev.voiceoverSubtitles?.map(s => s.id === sub.id ? { ...s, text: e.target.value } : s) };
                });
              }}
              placeholder="Type exact subtitle text..."
              style={{ width: '100%', minHeight: '60px', padding: '8px', fontSize: '14px', borderRadius: '4px', border: '1px solid #334155', background: '#0f172a', color: 'white', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>
        </div>
      ))}

      {(!result.voiceoverSubtitles || result.voiceoverSubtitles.length === 0) && (
        <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px', backgroundColor: '#0f172a', borderRadius: '4px', border: '1px dashed #334155' }}>
          No subtitles exist. Click "+ Add Subtitle" to create one.
        </div>
      )}
    </div>
  );
}

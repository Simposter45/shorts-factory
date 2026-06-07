'use client';

import React from 'react';
import type { StoryboardResponse } from '../../types';

interface SearchSwapModalProps {
  isSearchModalOpen: boolean;
  setIsSearchModalOpen: (v: boolean) => void;
  searchModalQuery: string;
  setSearchModalQuery: (q: string) => void;
  searchModalResults: any[];
  setSearchModalResults: (r: any[]) => void;
  isSearchingYoutube: boolean;
  setIsSearchingYoutube: (v: boolean) => void;
  trimmerVideo: any | null;
  setTrimmerVideo: (v: any) => void;
  trimmerStartTime: number;
  setTrimmerStartTime: (t: number) => void;
  searchModalSceneId: string | null;
  isDownloadingPreview: boolean;
  setIsDownloadingPreview: (v: boolean) => void;
  setDownloadingPreviewId: (id: string | null) => void;
  result: StoryboardResponse | null;
  setResult: React.Dispatch<React.SetStateAction<StoryboardResponse | null>>;
}

export default function SearchSwapModal({
  isSearchModalOpen, setIsSearchModalOpen,
  searchModalQuery, setSearchModalQuery,
  searchModalResults, setSearchModalResults,
  isSearchingYoutube, setIsSearchingYoutube,
  trimmerVideo, setTrimmerVideo,
  trimmerStartTime, setTrimmerStartTime,
  searchModalSceneId,
  isDownloadingPreview, setIsDownloadingPreview, setDownloadingPreviewId,
  result, setResult,
}: SearchSwapModalProps) {
  if (!isSearchModalOpen) return null;

  const runSearch = () => {
    setIsSearchingYoutube(true);
    fetch('/api/search-youtube', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: searchModalQuery }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.videos) setSearchModalResults(data.videos);
        setIsSearchingYoutube(false);
      })
      .catch(() => setIsSearchingYoutube(false));
  };

  const handleExtractClip = () => {
    const scene = result?.scenes.find(s => s.id === searchModalSceneId);
    if (!scene) return;
    const duration = Math.ceil(scene.duration);
    setDownloadingPreviewId(trimmerVideo.videoId);
    setIsDownloadingPreview(true);
    fetch('/api/download-youtube-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: trimmerVideo.url, startTime: trimmerStartTime, duration }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.localUrl && result) {
          setResult({
            ...result,
            scenes: (result.scenes || []).map(s =>
              s.id === searchModalSceneId
                ? { ...s, mediaUrl: data.localUrl, mediaStartTime: trimmerStartTime }
                : s
            ),
          });
          setIsSearchModalOpen(false);
          setTrimmerVideo(null);
        }
        setIsDownloadingPreview(false);
        setDownloadingPreviewId(null);
      })
      .catch(() => {
        setIsDownloadingPreview(false);
        setDownloadingPreviewId(null);
      });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '800px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>Search &amp; Swap Media</h2>
          <button
            onClick={() => setIsSearchModalOpen(false)}
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
          >
            &times;
          </button>
        </div>

        {/* Trimmer view */}
        {trimmerVideo ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button
              onClick={() => setTrimmerVideo(null)}
              style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
            >
              &larr; Back to Search Results
            </button>
            <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: '8px', overflow: 'hidden' }}>
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${trimmerVideo.videoId}?autoplay=1`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#f8f9fa', padding: '16px', borderRadius: '8px', border: '1px solid #ddd' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 8px 0' }}>Extract HD Clip</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>Watch the video and type the exact start time in seconds. The engine will extract a high-quality snippet to match this scene's duration.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontWeight: 'bold' }}>Start Time (sec):</label>
                <input
                  type="number"
                  min="0"
                  value={trimmerStartTime}
                  onChange={e => setTrimmerStartTime(Number(e.target.value))}
                  style={{ width: '80px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px' }}
                />
              </div>
              <button
                onClick={handleExtractClip}
                disabled={isDownloadingPreview}
                style={{ padding: '12px 24px', background: isDownloadingPreview ? '#ccc' : '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: isDownloadingPreview ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '16px' }}
              >
                {isDownloadingPreview ? 'Extracting...' : '✂️ Extract Clip'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Search input */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                type="text"
                value={searchModalQuery}
                onChange={e => setSearchModalQuery(e.target.value)}
                style={{ flex: 1, padding: '12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px' }}
                placeholder="Search YouTube for b-roll..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isSearchingYoutube) runSearch();
                }}
              />
              <button
                onClick={runSearch}
                disabled={isSearchingYoutube}
                style={{ padding: '0 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: isSearchingYoutube ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
              >
                {isSearchingYoutube ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Results */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {searchModalResults.map((v) => (
                <div key={v.videoId} style={{ display: 'flex', gap: '16px', padding: '12px', border: '1px solid #eee', borderRadius: '8px', alignItems: 'center' }}>
                  <img src={v.thumbnail} alt={v.title} style={{ width: '160px', height: '90px', objectFit: 'cover', borderRadius: '4px' }} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>{v.title}</h4>
                    <span style={{ fontSize: '12px', color: '#666', background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px' }}>{v.duration}</span>
                  </div>
                  <button
                    onClick={() => setTrimmerVideo(v)}
                    style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                  >
                    Select Video
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

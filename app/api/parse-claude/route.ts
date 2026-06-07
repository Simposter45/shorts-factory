import { NextResponse } from 'next/server';
import type { ClaudeSections, Scene, StoryboardResponse } from '../../../types';
import ytSearch from 'yt-search';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';

// Global memory sets to prevent repeats across multiple generations in the same session
const globalUsedPexels = new Set<string>();
const globalUsedYoutube = new Set<string>();
const globalUsedImages = new Set<string>();

async function fetchYouTubeVideo(query: string, usedSet: Set<string>): Promise<string | null> {
  try {
    const r = await ytSearch(query);
    if (r && r.videos && r.videos.length > 0) {
      let selectedVideo = r.videos.find(v => !usedSet.has(v.videoId));
      if (!selectedVideo) selectedVideo = r.videos[0];
      if (selectedVideo) {
        usedSet.add(selectedVideo.videoId);
        return 'https://www.youtube.com/watch?v=' + selectedVideo.videoId;
      }
    }
  } catch (err) {
    console.error("YouTube Search Error:", err);
  }
  return null;
}


async function fetchPexelsVideo(query: string, usedSet: Set<string>): Promise<string | null> {
  if (!PEXELS_API_KEY) return null;
  try {
    const res = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&orientation=portrait&size=large&per_page=15`, {
      headers: { Authorization: PEXELS_API_KEY }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.videos && data.videos.length > 0) {
      let selectedVideo = data.videos.find((v: any) => !usedSet.has(v.id.toString()));
      if (!selectedVideo) selectedVideo = data.videos[0];
      if (selectedVideo) {
        usedSet.add(selectedVideo.id.toString());
        const videoFiles = selectedVideo.video_files;
        // Sort by highest resolution
        videoFiles.sort((a: any, b: any) => (b.width * b.height) - (a.width * a.height));
        return videoFiles[0].link;
      }
    }
    return null;
  } catch (error) {
    console.error("Error fetching from Pexels:", error);
    return null;
  }
}

async function fetchWebImage(query: string, usedImages: Set<string>): Promise<string | null> {
  try {
    const optimizedQuery = query;
    const resToken = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(optimizedQuery)}`, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
        }
    });
    const html = await resToken.text();
    const vqdMatch = html.match(/vqd=([0-9-]+)/);
    
    if (!vqdMatch) {
      return null;
    }
    
    const url = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(optimizedQuery)}&vqd=${vqdMatch[1]}&f=,,,&p=1`;
    const resSearch = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            "Referer": "https://duckduckgo.com/"
        }
    });
    
    const data = await resSearch.json();
    if (data.results && data.results.length > 0) {
        const blockedDomains = ['alamy', 'getty', 'shutterstock', 'istock', 'dreamstime', 'depositphotos'];
        
        for (const result of data.results) {
            const urlLower = result.image.toLowerCase();
            const isBlocked = blockedDomains.some(domain => urlLower.includes(domain));
            
            if (!usedImages.has(result.image) && !isBlocked) {
                usedImages.add(result.image);
                return result.image;
            }
        }
        
        for (const result of data.results) {
            const urlLower = result.image.toLowerCase();
            if (!blockedDomains.some(domain => urlLower.includes(domain))) {
                return result.image;
            }
        }
        
        return data.results[0].image;
    }
    return null;
  } catch (error) {
    console.error("Web Image Search error:", error);
    return null;
  }
}

function parseMasterTimeline(text: string): { scenes: any[], subtitles: any[] } {
  if (!text) return { scenes: [], subtitles: [] };
  const lines = text.split('\n');
  const scenes = [];
  const subtitles = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    const match = line.match(/(\d+):(\d+)[^\d]+(\d+):(\d+)\s*\|\s*(.*)/);
    if (match) {
      const startMin = parseInt(match[1]);
      const startSec = parseInt(match[2]);
      const endMin = parseInt(match[3]);
      const endSec = parseInt(match[4]);
      
      const startTime = startMin * 60 + startSec;
      const endTime = endMin * 60 + endSec;
      const duration = endTime - startTime;
      
      const parts = match[5].split('|').map(p => p.trim());
      
      let type = 'VIDEO';
      let search = '';
      let domain = '';
      let voiceover = '';
      let animation: string | undefined = undefined;
      
      for (const part of parts) {
        const colonIdx = part.indexOf(':');
        if (colonIdx === -1) continue;
        const key = part.slice(0, colonIdx).trim().toUpperCase();
        const val = part.slice(colonIdx + 1).trim();
        
        if (key === 'TYPE') type = val.toUpperCase();
        else if (key === 'SEARCH') search = val.replace(/^["']|["']$/g, '');
        else if (key === 'DOMAIN') domain = val.replace(/^\[|\]$/g, '');
        else if (key === 'VOICEOVER') voiceover = val;
        else if (key === 'KEN BURNS') {
           const a = val.toLowerCase();
           if (a.includes('zoom in')) animation = 'zoom-in';
           else if (a.includes('zoom out')) animation = 'zoom-out';
           else if (a.includes('left to right')) animation = 'pan-left-right';
           else if (a.includes('right to left')) animation = 'pan-right-left';
        }
      }
      
      if (domain && domain !== 'YOUR BRAND ASSET') {
         search = `${search} site:${domain}`;
      }
      
      if (duration > 0) {
        scenes.push({
          startTime,
          endTime,
          duration,
          assetType: type === 'IMAGE' ? 'specific' : 'b-roll',
          searchQuery: search,
          voiceover,
          animation
        });
        
        if (voiceover && voiceover.trim() !== '') {
          subtitles.push({
            id: `sub_${Date.now()}_${Math.random()}`,
            text: voiceover,
            startTime,
            duration
          });
        }
      }
    }
  }
  return { scenes, subtitles };
}

function parseTextOverlays(text: string) {
  if (!text) return [];
  const lines = text.split('\n');
  const results = [];
  for (const line of lines) {
    const startMatch = line.match(/(\d+):(\d+)/);
    if (!startMatch) continue;
    
    const startMin = parseInt(startMatch[1]);
    const startSec = parseInt(startMatch[2]);
    const startTime = startMin * 60 + startSec;
    
    let duration = 4;
    const durMatch = line.match(/\((\d+)\s*s/i);
    if (durMatch) {
      duration = parseInt(durMatch[1]);
    } else {
      const endMatch = line.match(/(\d+):(\d+)[^\d]+(\d+):(\d+)/);
      if (endMatch) {
        const endMin = parseInt(endMatch[3]);
        const endSec = parseInt(endMatch[4]);
        duration = (endMin * 60 + endSec) - startTime;
      }
    }
    
    if (duration <= 0) duration = 4;

    let overlayText = line;
    overlayText = overlayText.replace(/\b\d+:\d+(?:\s*-\s*\d+:\d+)?\b/g, '');
    overlayText = overlayText.replace(/\(\d+\s*s(?:econds?)?\)/ig, '');
    overlayText = overlayText.replace(/\b(?:at|LOWER THIRD|TEXT OVERLAY|TEXT|Title)\b/ig, '');
    overlayText = overlayText.replace(/^[\s:|\\-]+/g, '');
    
    overlayText = overlayText.trim();
    if (overlayText.startsWith('"') && overlayText.endsWith('"')) overlayText = overlayText.slice(1, -1);
    if (overlayText.startsWith("'") && overlayText.endsWith("'")) overlayText = overlayText.slice(1, -1);
    overlayText = overlayText.trim();
    
    if (overlayText) {
      results.push({ startTime, duration, text: overlayText });
    }
  }
  return results;
}

export async function POST(request: Request) {
  try {
    const sections: ClaudeSections = await request.json();
    
    const { scenes: parsedScenes, subtitles: parsedSubtitles } = parseMasterTimeline(sections.masterTimeline);
    const textOverlays = parseTextOverlays(sections.textOverlays || '');
    const musicSuggestions = [
      'Cinematic Epic Trailer Music',
      'Upbeat Lo-Fi Chillhop',
      'Fast-paced Electronic Dance',
      'Inspiring Corporate Ambient',
      'Intense Action Percussion'
    ];
    const finalScenes: Scene[] = [];
    for (const clip of parsedScenes) {
      let mediaUrl: string | null = null;
      if (clip.assetType === 'specific') {
        mediaUrl = await fetchWebImage(clip.searchQuery, globalUsedImages);
      } else {
        mediaUrl = await fetchPexelsVideo(clip.searchQuery, globalUsedPexels);
        if (!mediaUrl) {
           mediaUrl = await fetchYouTubeVideo(clip.searchQuery, globalUsedYoutube);
        }
      }

      if (!mediaUrl) {
        mediaUrl = `https://images.unsplash.com/photo-1518605368461-1e1e1146313b?q=80&w=800&auto=format&fit=crop&text=${encodeURIComponent(clip.searchQuery)}`;
      }

      const overlay = textOverlays.find(t => t.startTime >= clip.startTime && t.startTime < clip.endTime);
      let textOverlayObj;
      if (overlay) {
        textOverlayObj = {
          text: overlay.text,
          startTime: overlay.startTime - clip.startTime,
          duration: overlay.duration
        };
      }

      finalScenes.push({
        id: `scene_${Date.now()}_${Math.random()}`,
        description: clip.voiceover || clip.searchQuery,
        searchQuery: clip.searchQuery,
        assetType: clip.assetType,
        mediaUrl,
        duration: clip.duration,
        textOverlay: textOverlayObj,
        animation: clip.animation as any
      });
    }

    const response: StoryboardResponse = {
      scenes: finalScenes,
      voiceoverSubtitles: parsedSubtitles,
      musicSuggestions
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Parse Claude error:', error);
    return NextResponse.json({ error: 'Failed to parse sections and build timeline' }, { status: 500 });
  }
}

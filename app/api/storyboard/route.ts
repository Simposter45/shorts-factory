import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import type { GenerateRequest, StoryboardResponse, Scene } from '../../../types';

// Initialize Gemini SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// API Keys
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';

async function generateStoryboardSegments(prompt: string): Promise<Omit<Scene, 'mediaUrl'>[]> {
  const systemInstruction = `You are a professional video producer creating short-form vertical videos (YouTube Shorts/Instagram Reels).
The user will provide a script or concept. Break this down into distinct video scenes.
For each scene, provide:
1. "id": A unique string ID.
2. "description": A short description of the visual and what the voiceover would say.
3. "assetType": Must be either "specific" (if the scene focuses on a specific named player, team, or real-world entity where we need an actual photo of them) OR "b-roll" (if the scene can use generic stock footage like a crowd, stadium, or generic players).
4. "searchQuery": If assetType is "specific", this MUST be ONLY the exact person's name with NO extra words or adjectives (e.g., "Christian Pulisic" - NOT "Christian Pulisic celebrating"). If "b-roll", use generic terms (e.g., "football stadium night").
5. "duration": The duration in seconds.

Respond ONLY with a valid JSON array of objects matching this exact structure.`;

  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("Missing GEMINI_API_KEY. Using mock data.");
      throw new Error("Missing API Key");
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
      }
    });

    const text = response.text || "[]";
    const segments = JSON.parse(text);
    return segments as Omit<Scene, 'mediaUrl'>[];
  } catch (error: any) {
    console.error("Error generating storyboard:", error);
    if (error?.status === 429 || error?.message?.includes('quota') || error?.message?.includes('429')) {
      throw new Error("QUOTA_EXCEEDED");
    }
    throw error;
  }
}

async function fetchPexelsVideo(query: string): Promise<string | null> {
  if (!PEXELS_API_KEY) return null;
  try {
    const res = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&orientation=portrait&size=large&per_page=1`, {
      headers: { Authorization: PEXELS_API_KEY }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.videos && data.videos.length > 0) {
      const videoFiles = data.videos[0].video_files;
      const hdFile = videoFiles.find((file: any) => file.quality === 'hd') || videoFiles[0];
      return hdFile.link;
    }
    return null;
  } catch (error) {
    console.error("Error fetching from Pexels:", error);
    return null;
  }
}

// Bypassing Google Cloud to use an anonymous Web Image Scraper (DuckDuckGo)
// This is 100% free, requires NO api keys, and returns recent high quality news images.
async function fetchWebImage(query: string, usedImages: Set<string>): Promise<string | null> {
  try {
    const optimizedQuery = query;
    
    // 1. Get the VQD token from DDG
    const resToken = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(optimizedQuery)}`, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
        }
    });
    const html = await resToken.text();
    const vqdMatch = html.match(/vqd=([0-9-]+)/);
    
    if (!vqdMatch) {
      console.warn("No web search token found");
      return null;
    }
    
    // 2. Search images using the token
    const url = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(optimizedQuery)}&vqd=${vqdMatch[1]}&f=,,,&p=1`;
    const resSearch = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            "Referer": "https://duckduckgo.com/"
        }
    });
    
    const data = await resSearch.json();
    if (data.results && data.results.length > 0) {
        // List of known watermark/stock domains to avoid
        const blockedDomains = ['alamy', 'getty', 'shutterstock', 'istock', 'dreamstime', 'depositphotos'];
        
        // Iterate through results to find an image we haven't used yet and doesn't have a watermark
        for (const result of data.results) {
            const urlLower = result.image.toLowerCase();
            const isBlocked = blockedDomains.some(domain => urlLower.includes(domain));
            
            if (!usedImages.has(result.image) && !isBlocked) {
                usedImages.add(result.image);
                return result.image;
            }
        }
        
        // Fallback to the first non-blocked image if we run out of unique ones
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

export async function POST(request: Request) {
  try {
    const body: GenerateRequest = await request.json() as GenerateRequest;

    if (!body.prompt || typeof body.prompt !== 'string') {
       return NextResponse.json({ error: 'Valid prompt is required' }, { status: 400 });
    }

    const segments = await generateStoryboardSegments(body.prompt);
    
    const usedWebImages = new Set<string>();
    
    const scenes: Scene[] = await Promise.all(
      segments.map(async (seg) => {
        let mediaUrl: string | null = null;
        
        if (seg.assetType === 'specific') {
           mediaUrl = await fetchWebImage(seg.searchQuery, usedWebImages);
        } else {
           mediaUrl = await fetchPexelsVideo(seg.searchQuery);
        }

        if (!mediaUrl) {
           mediaUrl = `https://images.unsplash.com/photo-1518605368461-1e1e1146313b?q=80&w=800&auto=format&fit=crop&text=${encodeURIComponent(seg.searchQuery)}`;
        }
        return { ...seg, mediaUrl };
      })
    );

    const response: StoryboardResponse = {
      scenes,
      voiceoverSubtitles: [],
      musicSuggestions: [
        'Cinematic Epic Trailer Music',
        'Upbeat Lo-Fi Chillhop',
        'Fast-paced Electronic Dance',
        'Inspiring Corporate Ambient',
        'Intense Action Percussion'
      ]
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Storyboard generation error:', error);
    if (error.message === "QUOTA_EXCEEDED" || error?.status === 429) {
      return NextResponse.json({ error: "Your Gemini API key has exceeded its daily free quota (20 requests/day). Please try again tomorrow or use a new Google Cloud account." }, { status: 429 });
    }
    return NextResponse.json({ error: 'Failed to generate storyboard' }, { status: 500 });
  }
}

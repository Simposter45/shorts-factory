import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import type { ClaudeSections } from '../../../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(request: Request) {
  try {
    const { concept } = await request.json();

    if (!concept || typeof concept !== 'string') {
      return NextResponse.json({ error: 'Valid concept is required' }, { status: 400 });
    }

    const systemInstruction = `You are a professional video producer creating short-form vertical videos.
The user will provide a concept. You need to write a "Director's Cut" script that follows exactly 2 sections.
Return a JSON object with exactly these 2 keys:
1. "voiceoverOnly": Just the text the voiceover will read, formatted cleanly for TTS. Line by line.
2. "masterTimeline": The master timeline of the video formatted exactly like this example:
0:00-0:04 | TYPE: VIDEO | SOURCE: Pexels | Search: "soccer player injury medical staff" | Voiceover: The World Cup hasn't even started.
0:04-0:08 | TYPE: IMAGE | Search: "Lionel Messi Argentina kit 2026" | Domain: wikipedia.org | Ken Burns: Slow zoom in | Voiceover: Messi left the field injured for Inter Miami.

The duration should be appropriate for a short form video (e.g. 30-60s). The timestamps should sequentially cover the entire video duration.
Respond ONLY with a valid JSON object matching this structure.`;

    if (!process.env.GEMINI_API_KEY) {
      console.warn("Missing GEMINI_API_KEY.");
      throw new Error("Missing API Key");
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: concept,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
      }
    });

    const text = response.text || "{}";
    const sections: ClaudeSections = JSON.parse(text);

    return NextResponse.json(sections);
  } catch (error: any) {
    console.error('Generate sections error:', error);
    if (error.message === "QUOTA_EXCEEDED" || error?.status === 429) {
      return NextResponse.json({ error: "Your Gemini API key has exceeded its daily free quota. Please use manual copy-paste mode." }, { status: 429 });
    }
    return NextResponse.json({ error: 'Failed to generate sections' }, { status: 500 });
  }
}

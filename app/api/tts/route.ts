import { NextResponse } from 'next/server';
import { EdgeTTS } from 'node-edge-tts';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function POST(request: Request) {
  try {
    const { text, voice, rate } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const tts = new EdgeTTS({
      voice: voice || 'en-US-ChristopherNeural',
      lang: 'en-US',
      outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
      rate: rate || '+0%',
      saveSubtitles: true,
    });

    // Create a temporary file path
    const tmpFilePath = path.join(os.tmpdir(), `tts-${Date.now()}-${Math.random().toString(36).substring(7)}.mp3`);

    // Generate the audio file
    await tts.ttsPromise(text, tmpFilePath);

    // Read the generated file into a buffer
    const audioBuffer = fs.readFileSync(tmpFilePath);

    // Clean up the temporary file
    fs.unlinkSync(tmpFilePath);

    // Check if subtitles were generated
    const subPath = tmpFilePath + '.json';
    let wordTimings = [];
    if (fs.existsSync(subPath)) {
      try {
        wordTimings = JSON.parse(fs.readFileSync(subPath, 'utf8'));
      } catch (e) {
        console.error("Failed to parse TTS subtitles", e);
      }
      fs.unlinkSync(subPath);
    }

    // Return JSON with base64 audio and word timings
    return NextResponse.json({
      audioBase64: audioBuffer.toString('base64'),
      wordTimings,
    });
  } catch (error: any) {
    console.error('Error generating TTS:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate TTS' }, { status: 500 });
  }
}

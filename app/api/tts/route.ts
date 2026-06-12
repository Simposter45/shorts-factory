import { NextResponse } from 'next/server';
import { CustomEdgeTTS } from './CustomEdgeTTS';
import fs from 'fs';
import path from 'path';
import os from 'os';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

export async function POST(request: Request) {
  let tmpDir = '';
  try {
    const { text, voice, rate, reverb } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Default to en-US if not specified, parsing from the voice prefix
    const lang = voice ? voice.split('-').slice(0, 2).join('-') : 'en-US';

    const tts = new CustomEdgeTTS({
      voice: voice || 'en-US-ChristopherNeural',
      lang: lang,
      outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
      rate: rate || '+0%',
      saveSubtitles: true,
    });

    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tts-'));

    // Parse <break time="...ms" /> tags manually
    const chunks: { text: string, delayMs: number }[] = [];
    let remaining = text;
    // Handle either <break time="2000ms" /> or <break time="2s" />
    const breakRegex = /<break\s+time=["']?(\d+)(ms|s)["']?\s*\/?>/i;

    // Clean up <speak> tags if the user wrapped it and remove any <!-- comments -->
    remaining = remaining.replace(/<!--[\s\S]*?-->/g, '').replace(/<\/?speak[^>]*>/gi, '').trim();

    while (remaining) {
      const match = remaining.match(breakRegex);
      if (match) {
        const preText = remaining.slice(0, match.index).trim();
        const duration = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        const delayMs = unit === 's' ? duration * 1000 : duration;
        
        if (preText || delayMs > 0) {
          chunks.push({ text: preText, delayMs });
        }
        remaining = remaining.slice((match.index || 0) + match[0].length).trim();
      } else {
        if (remaining.trim()) {
          chunks.push({ text: remaining.trim(), delayMs: 0 });
        }
        break;
      }
    }

    const filesToMerge: string[] = [];
    let finalWordTimings: any[] = [];
    let currentAccumulatedTime = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      if (chunk.text) {
        const chunkAudioPath = path.join(tmpDir, `chunk_${i}.mp3`);
        await tts.ttsPromise(chunk.text, chunkAudioPath);
        filesToMerge.push(chunkAudioPath);
        
        // Get audio duration using ffprobe
        const durationSec: number = await new Promise((res, rej) => {
          ffmpeg.ffprobe(chunkAudioPath, (err, metadata) => {
            if (err) rej(err);
            else res(metadata.format.duration || 0);
          });
        });

        // Parse subtitles
        const subPath = chunkAudioPath + '.json';
        if (fs.existsSync(subPath)) {
          const chunkTimings = JSON.parse(fs.readFileSync(subPath, 'utf8'));
          chunkTimings.forEach((t: any) => {
            finalWordTimings.push({
              part: t.part,
              start: Math.round(t.start + (currentAccumulatedTime * 1000)),
              end: Math.round(t.end + (currentAccumulatedTime * 1000))
            });
          });
          fs.unlinkSync(subPath);
        }

        currentAccumulatedTime += durationSec;
      }
      
      if (chunk.delayMs > 0) {
        const silencePath = path.join(tmpDir, `silence_${i}.mp3`);
        const durationSec = chunk.delayMs / 1000;
        await new Promise((resolve, reject) => {
          ffmpeg()
            .input('anullsrc=r=24000:cl=mono')
            .inputFormat('lavfi')
            .duration(durationSec)
            .audioCodec('libmp3lame')
            .audioBitrate('48k')
            .save(silencePath)
            .on('end', resolve)
            .on('error', reject);
        });
        filesToMerge.push(silencePath);
        currentAccumulatedTime += durationSec;
      }
    }

    if (filesToMerge.length === 0) {
      throw new Error("No text provided or generated");
    }

    const finalPath = path.join(tmpDir, 'final.mp3');

    if (filesToMerge.length === 1 && !reverb) {
      fs.copyFileSync(filesToMerge[0], finalPath);
    } else {
      await new Promise((resolve, reject) => {
        const mergeCmd = ffmpeg();
        filesToMerge.forEach(f => mergeCmd.input(f));
        
        // Create a complex filter for proper audio concatenation
        let filterComplex = '';
        filesToMerge.forEach((f, i) => {
          filterComplex += `[${i}:a]`;
        });
        filterComplex += `concat=n=${filesToMerge.length}:v=0:a=1[concat_out];`;

        if (reverb) {
          // Heavy stadium reverb + slight pitch drop
          filterComplex += `[concat_out]aecho=0.8:0.9:500|1000:0.2|0.1,asetrate=24000*0.9,aresample=24000,atempo=1.1[outa]`;
        } else {
          filterComplex += `[concat_out]anull[outa]`;
        }

        mergeCmd
          .complexFilter([filterComplex])
          .outputOptions(['-map [outa]'])
          .audioCodec('libmp3lame')
          .save(finalPath)
          .on('end', resolve)
          .on('error', reject);
      });
    }

    // Read the generated file into a buffer
    const audioBuffer = fs.readFileSync(finalPath);

    // Return JSON with base64 audio and word timings
    return NextResponse.json({
      audioBase64: audioBuffer.toString('base64'),
      wordTimings: finalWordTimings,
    });
  } catch (error: any) {
    console.error('Error generating TTS:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate TTS' }, { status: 500 });
  } finally {
    if (tmpDir && fs.existsSync(tmpDir)) {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch (e) {
        console.error("Failed to clean up tmp dir:", e);
      }
    }
  }
}

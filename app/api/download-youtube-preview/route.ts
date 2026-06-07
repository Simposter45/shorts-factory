import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { promisify } from 'util';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { url, startTime = 0, duration = 8 } = await request.json();
    if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

    const tempDir = path.join(process.cwd(), 'public', 'temp');
    try {
      await fs.mkdir(tempDir, { recursive: true });
    } catch (e) {}

    // Extract video ID for filename
    const videoIdMatch = url.match(/v=([^&]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : Date.now().toString();
    const fileName = `preview_${videoId}_${startTime}.mp4`;
    const outputPath = path.join(tempDir, fileName);

    // If it already exists, just return it to save time
    try {
      await fs.access(outputPath);
      return NextResponse.json({ localUrl: `/temp/${fileName}` });
    } catch (e) {
      // File doesn't exist, proceed to download
    }

    // Download HD format for high quality snippet
    const endTime = startTime + duration;
    const ytdlpCommand = `yt-dlp --ffmpeg-location "${ffmpegInstaller.path}" --download-sections "*${startTime}-${endTime}" --force-overwrites -f "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best" -o "${outputPath}" "${url}"`;
    
    await execAsync(ytdlpCommand);

    return NextResponse.json({ localUrl: `/temp/${fileName}` });
  } catch (error) {
    console.error("YouTube Preview Download API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

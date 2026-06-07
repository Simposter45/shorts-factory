import { NextResponse } from 'next/server';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';
import util from 'util';
const execPromise = util.promisify(exec);

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

export async function POST(request: Request) {
  let tmpDir = '';
  try {
    const formData = await request.formData();
    const scenesStr = formData.get('scenes') as string;
    const voiceoverSubtitlesStr = formData.get('voiceoverSubtitles') as string;
    
    if (!scenesStr) {
      return NextResponse.json({ error: 'No scenes provided' }, { status: 400 });
    }

    const scenes = JSON.parse(scenesStr);
    const voiceoverSubtitles = voiceoverSubtitlesStr ? JSON.parse(voiceoverSubtitlesStr) : [];
    
    const voiceover = formData.get('voiceover') as File;
    const bgMusic = formData.get('bgMusic') as File | null;
    const bgmKey = formData.get('bgmKey') as string | null;
    const bgmVolumeStr = formData.get('bgmVolume') as string | null;
    const bgmVolume = bgmVolumeStr ? parseFloat(bgmVolumeStr) : 0.1;
    
    const reactionFaceFile = formData.get('reactionFaceFile') as File | null;
    const reactionFacePosition = formData.get('reactionFacePosition') as string || 'bottom-right';
    const characterSelect = formData.get('characterSelect') as string || 'commentator_1';

    tmpDir = path.join(os.tmpdir(), `video-automator-${uuidv4()}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    console.log(`[Render] Started rendering task. TmpDir: ${tmpDir}`);

    // 1. Save uploaded audio
    const voPath = path.join(tmpDir, 'vo.mp3');
    fs.writeFileSync(voPath, Buffer.from(await voiceover.arrayBuffer()));
    
    let bgPath = null;
    if (bgMusic) {
      bgPath = path.join(tmpDir, 'bg.mp3');
      fs.writeFileSync(bgPath, Buffer.from(await bgMusic.arrayBuffer()));
    } else if (bgmKey && bgmKey !== 'none') {
      const publicBgmDir = path.join(process.cwd(), 'public', 'bgm');
      const possibleExtensions = ['.mp3', '.ogg'];
      for (const ext of possibleExtensions) {
        const checkPath = path.join(publicBgmDir, `${bgmKey}${ext}`);
        if (fs.existsSync(checkPath)) {
          bgPath = checkPath;
          break;
        }
      }
    }

    const findAlternativeMedia = async (query: string, excludeUrl: string) => {
      try {
        const resToken = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const html = await resToken.text();
        const vqdMatch = html.match(/vqd=([\d-]+)/);
        if (!vqdMatch) return null;
        const resSearch = await fetch(`https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&o=json&vqd=${vqdMatch[1]}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const data = await resSearch.json();
        if (data.results && data.results.length > 0) {
          const valid = data.results.filter((r: any) => !['alamy', 'getty', 'shutterstock'].some(d => r.image.toLowerCase().includes(d)) && r.image !== excludeUrl);
          return valid.length > 0 ? valid[Math.floor(Math.random() * Math.min(valid.length, 5))].image : data.results[0].image;
        }
      } catch (e) { return null; }
      return null;
    };

    // 2. Download and Normalize Media Clips
    const clips: any[] = [];
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      if (!scene.mediaUrl) continue;

      console.log(`[Render] Downloading media for scene ${i+1}... (${scene.mediaUrl})`);
      let mediaBuf: Buffer | null = null;
      let isVideo = scene.mediaUrl.includes('.mp4');
      let currentUrl = scene.mediaUrl;
      let attempts = 0;

      let ext = isVideo ? 'mp4' : 'jpg';
      let rawPath = path.join(tmpDir, `raw_${i}.${ext}`);
      
      const localFile = formData.get(`local_media_${scene.id}`) as File | null;
      if (localFile) {
        console.log(`[Render] Using local uploaded file for scene ${i+1}`);
        const buf = Buffer.from(await localFile.arrayBuffer());
        ext = localFile.type.includes('video') || localFile.name.endsWith('.mp4') ? 'mp4' : 'jpg';
        isVideo = ext === 'mp4';
        rawPath = path.join(tmpDir, `raw_${i}.${ext}`);
        fs.writeFileSync(rawPath, buf);
        mediaBuf = buf;
      } else if (currentUrl.startsWith('/temp/preview_') || currentUrl.startsWith('temp/preview_')) {
         console.log(`[Render] Using local YouTube preview file for scene ${i+1}`);
         isVideo = true;
         ext = 'mp4';
         rawPath = path.join(tmpDir, `raw_${i}.${ext}`);
         
         const publicTempPath = path.join(process.cwd(), 'public', currentUrl.startsWith('/') ? currentUrl.slice(1) : currentUrl);
         if (fs.existsSync(publicTempPath)) {
            mediaBuf = fs.readFileSync(publicTempPath);
         } else {
            console.error(`[Render] Local preview file not found: ${publicTempPath}`);
         }
      } else if (currentUrl.includes('youtube.com') || currentUrl.includes('youtu.be')) {
         console.log(`[Render] Downloading YouTube video using yt-dlp... (${currentUrl})`);
         isVideo = true;
         ext = 'mp4';
         rawPath = path.join(tmpDir, `raw_${i}.${ext}`);
         try {
           const ytDlpPath = path.join(process.cwd(), 'yt-dlp.exe');
           // Get best video format, optionally capping at 1080p to prevent massive downloads
           const cmd = `"${ytDlpPath}" -f "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best" --no-playlist -o "${rawPath}" "${currentUrl}"`;
           await execPromise(cmd);
           if (fs.existsSync(rawPath)) {
             mediaBuf = fs.readFileSync(rawPath);
           }
         } catch (e) {
           console.error(`[Render] yt-dlp failed for scene ${i+1}:`, e);
         }
      }

      if (!mediaBuf) {
        while (attempts < 3 && !mediaBuf) {
          attempts++;
          try {
            const res = await fetch(currentUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': '*/*',
                'Referer': new URL(currentUrl).origin + '/'
              }
            });
            if (res.ok) {
              const buf = Buffer.from(await res.arrayBuffer());
              if (buf.length > 500 && !buf.toString('utf8', 0, 10).toLowerCase().includes('<html')) {
                mediaBuf = buf;
                isVideo = currentUrl.includes('.mp4') || !!res.headers.get('content-type')?.includes('video');
                ext = isVideo ? 'mp4' : 'jpg';
                rawPath = path.join(tmpDir, `raw_${i}.${ext}`);
                break;
              }
            }
          } catch (err) { console.warn(`[Render] Attempt ${attempts} failed for scene ${i+1}`); }

          if (!mediaBuf && attempts < 3) {
            const query = scene.searchQuery || scene.mediaQuery || scene.description.substring(0, 30);
            console.log(`[Render] Auto-healing scene ${i+1}... searching for: ${query}`);
            const newUrl = await findAlternativeMedia(query, currentUrl);
            if (newUrl) currentUrl = newUrl;
            else break;
          }
        }
      }

      if (!mediaBuf) {
        console.warn(`[Render] Auto-healing search failed for scene ${i+1}. Using random photo fallback.`);
        try {
          const fallbackRes = await fetch('https://picsum.photos/1080/1920');
          if (fallbackRes.ok) {
            mediaBuf = Buffer.from(await fallbackRes.arrayBuffer());
            ext = 'jpg';
            isVideo = false;
            rawPath = path.join(tmpDir, `raw_${i}.${ext}`);
          }
        } catch (e) {
           console.error("Picsum fallback failed", e);
        }
      }

      if (!mediaBuf) {
        throw new Error(`Failed to find any working media for scene ${i+1}. Please try a different query.`);
      }

      // If we downloaded it, save it. (Local files are already saved above)
      if (!localFile) {
        fs.writeFileSync(rawPath, mediaBuf);
      }

      // Normalize to 1080x1920, 30fps
      console.log(`[Render] Normalizing scene ${i+1} to 9:16...`);
      const normPath = path.join(tmpDir, `norm_${i}.mp4`);
      await new Promise((resolve, reject) => {
        const cmd = ffmpeg();
        
        cmd.input(rawPath);
        
        // Loop video infinitely so it guarantees the output matches scene.duration
        if (isVideo) {
          if (scene.mediaStartTime && scene.mediaStartTime > 0) {
            cmd.inputOptions([`-ss`, `${scene.mediaStartTime}`, '-stream_loop', '-1']);
          } else {
            cmd.inputOptions(['-stream_loop', '-1']);
          }
        }
        
        const filters = [];
        if (!isVideo) {
          let imgFilter = '';
          const w3x = 3240;
          const h3x = 5760;
          if (scene.animation === 'zoom-in') {
            const d = Math.floor(scene.duration * 30);
            imgFilter = `scale=${w3x}:${h3x}:force_original_aspect_ratio=increase,crop=${w3x}:${h3x},zoompan=z='1+(0.15*(on/${d}))':d=${d}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${w3x}x${h3x}:fps=30,scale=1080:1920`;
          } else if (scene.animation === 'zoom-out') {
            const d = Math.floor(scene.duration * 30);
            imgFilter = `scale=${w3x}:${h3x}:force_original_aspect_ratio=increase,crop=${w3x}:${h3x},zoompan=z='1.15-(0.15*(on/${d}))':d=${d}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${w3x}x${h3x}:fps=30,scale=1080:1920`;
          } else if (scene.animation === 'pan-left-right') {
            imgFilter = `scale=${w3x}:${h3x}:force_original_aspect_ratio=increase,crop=${w3x}:${h3x}:'(in_w-${w3x})*(t/${scene.duration})':0,scale=1080:1920`;
          } else if (scene.animation === 'pan-right-left') {
            imgFilter = `scale=${w3x}:${h3x}:force_original_aspect_ratio=increase,crop=${w3x}:${h3x}:'(in_w-${w3x})*(1-(t/${scene.duration}))':0,scale=1080:1920`;
          } else {
            imgFilter = `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,loop=loop=-1:size=1:start=0`;
          }
          filters.push(imgFilter);
          cmd.loop(1).inputFPS(30);
        } else {
          filters.push(`scale=1080:1920:force_original_aspect_ratio=increase`);
          filters.push(`crop=1080:1920`);
        }

        filters.push(`setsar=1`);
        filters.push(`settb=1/90000`);
        filters.push(`format=yuv420p`);

        if (scene.textOverlay) {
          const escapedText = scene.textOverlay.text.replace(/'/g, "\u2019").replace(/:/g, "\\:").replace(/,/g, "\\,");
          const pos = scene.textOverlay.position || 'bottom';
          let yCoord = 'h*0.75';
          if (pos === 'top') yCoord = 'h*0.15';
          else if (pos === 'middle') yCoord = '(h-text_h)/2';
          
          filters.push(`drawtext=text='${escapedText}':fontcolor=white:fontsize=70:box=1:boxcolor=black@0.6:boxborderw=20:x=(w-text_w)/2:y=${yCoord}:enable='between(t,${scene.textOverlay.startTime},${scene.textOverlay.startTime + scene.textOverlay.duration})'`);
        }

        cmd.videoFilters(filters);
        
        cmd.setDuration(scene.duration)
           .videoCodec('libx264')
           .fps(30)
           .outputOptions(['-pix_fmt yuv420p', '-an'])
           .save(normPath)
           .on('start', (c) => console.log(`[Render] Command Scene ${i+1}:`, c))
           .on('end', resolve)
           .on('error', (err) => {
             console.error(`[Render] FFmpeg Error on Scene ${i+1}:`, err);
             reject(err);
           });
      });
      clips.push(normPath);
    }

    if (clips.length === 0) {
      throw new Error("No media clips were successfully downloaded.");
    }

    // 2.5 Generate ASS Captions
    console.log(`[Render] Generating exact 1080x1920 ASS captions...`);
    let assContent = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,60,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,3,2,2,10,10,150,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    const formatTime = (seconds: number) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      const cs = Math.floor((seconds % 1) * 100);
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
    };

    for (const sub of voiceoverSubtitles) {
      const start = sub.startTime;
      const end = start + sub.duration;
      let text = sub.text;
      
      if (!text || text.trim() === '') continue;

      const wrapText = (text: string, maxLen: number) => {
        const words = text.split(' ');
        let lines: string[] = [];
        let currentLine = '';
        for (const word of words) {
          if ((currentLine + word).length > maxLen) {
            lines.push(currentLine.trim());
            currentLine = word + ' ';
          } else {
            currentLine += word + ' ';
          }
        }
        lines.push(currentLine.trim());
        return lines.join('\\N');
      };

      const wrappedText = wrapText(text, 25);
      assContent += `Dialogue: 0,${formatTime(start)},${formatTime(end)},Default,,0,0,0,,${wrappedText}\n`;
    }

    const srtPath = path.join(tmpDir, 'captions.ass');
    fs.writeFileSync(srtPath, assContent);

    // 3. Merge video clips
    console.log(`[Render] Concatenating ${clips.length} clips...`);
    const mergedVideoPath = path.join(tmpDir, 'merged_video.mp4');
    
    let mergeSuccess = false;
    const hasAnyTransitions = scenes.some((s: any) => s.transitionNext);
    
    if (clips.length > 1) {
      try {
        await new Promise((resolve, reject) => {
          const mergeCmd = ffmpeg();
          clips.forEach(clip => mergeCmd.input(clip));
          
          let filterComplex = '';
          let accumDuration = scenes[0].duration;
          let lastOut = '[0:v]';
          
          for (let i = 0; i < clips.length - 1; i++) {
            const in2 = `[${i+1}:v]`;
            const out = `[v${i+1}]`;
            
            if (scenes[i].transitionNext) {
              const offset = Math.max(0, accumDuration - 0.5);
              filterComplex += `${lastOut}${in2}xfade=transition=fade:duration=0.5:offset=${offset}${out}; `;
              accumDuration = accumDuration + scenes[i+1].duration - 0.5;
            } else {
              filterComplex += `${lastOut}${in2}concat=n=2:v=1:a=0${out}; `;
              accumDuration = accumDuration + scenes[i+1].duration;
            }
            lastOut = out;
          }
          
          filterComplex = filterComplex.trim().replace(/;$/, '');
          
          mergeCmd.complexFilter(filterComplex)
                  .outputOptions([`-map ${lastOut}`])
                  .videoCodec('libx264')
                  .save(mergedVideoPath)
                  .on('end', resolve)
                  .on('error', reject);
        });
        mergeSuccess = true;
      } catch (err) {
        console.warn("[Render] Filter Complex Merge Error! Falling back to concat file:", err);
      }
    } else {
       // Only 1 clip
       fs.copyFileSync(clips[0], mergedVideoPath);
       mergeSuccess = true;
    }
    
    if (!mergeSuccess) {
      console.log(`[Render] Performing hard cut concatenation...`);
      await new Promise((resolve, reject) => {
        const mergeCmd = ffmpeg();
        clips.forEach(clip => mergeCmd.input(clip));
        mergeCmd.on('end', resolve)
                .on('error', (err) => {
                  console.error("[Render] Merge Error:", err);
                  reject(err);
                })
                .mergeToFile(mergedVideoPath, tmpDir);
      });
    }

    // 4. Final Compositing (Video + Voiceover + Background Music + Subtitles)
    console.log(`[Render] Compositing final video with audio and subtitles...`);
    const finalPath = path.join(tmpDir, 'final.mp4');

    // 4a. Analyze voiceover audio amplitude for audio-reactive avatar animation
    let avatarScaleExpr = '300+20*abs(sin(2*3.14159*t*1.5))'; // fallback: sine pulse
    try {
      console.log('[Render] Analyzing voiceover amplitude for avatar animation...');
      // amovie path: on Windows must use forward slashes and escaped colon
      const lavfiPath = voPath.replace(/\\/g, '/').replace(/([a-zA-Z]):\//, '$1\\://');
      const { stdout: rmsRaw } = await execPromise(
        `"${ffprobeInstaller.path}" -f lavfi -i "amovie=${lavfiPath},astats=metadata=1:reset=1" -show_entries frame_tags=lavfi.astats.Overall.RMS_level -of csv=p=0 -vn`,
        { timeout: 30000 }
      );

      const rmsFrames = rmsRaw.trim().split('\n')
        .map(v => parseFloat(v.trim()))
        .filter(v => !isNaN(v) && isFinite(v));

      if (rmsFrames.length > 10) {
        // MP3 audio frame = 1152 samples @ 44100Hz ≈ 0.02612s → ~38 audio frames per second
        const framesPerSec = Math.round(44100 / 1152);
        const secondsValues: number[] = [];
        for (let s = 0; s * framesPerSec < rmsFrames.length; s++) {
          const window = rmsFrames.slice(s * framesPerSec, (s + 1) * framesPerSec).filter(v => v > -100);
          secondsValues.push(window.length > 0 ? window.reduce((a, b) => a + b, 0) / window.length : -60);
        }

        // Normalize dB values → scale pixels in 280-340 range
        const validVals = secondsValues.filter(v => v > -100 && isFinite(v));
        const minDb = Math.max(Math.min(...validVals), -60);
        const maxDb = Math.max(...validVals);
        const dbRange = maxDb - minDb || 1;
        const scaleValues = secondsValues.map(v =>
          Math.round(280 + (Math.max(0, Math.min(1, (v - minDb) / dbRange))) * 60)
        );

        // Build piecewise linear FFmpeg expression (interpolates between 1-second keyframes)
        // e.g. if(lt(t,1), 290+(t-0)*10, if(lt(t,2), 300+(t-1)*(-5), ...))
        let expr = '';
        for (let i = 0; i < scaleValues.length - 1; i++) {
          const delta = scaleValues[i + 1] - scaleValues[i];
          const lerp = `${scaleValues[i]}+${delta}*(t-${i})`;
          expr += `if(lt(t,${i + 1}),${lerp},`;
        }
        expr += String(scaleValues[scaleValues.length - 1]);
        expr += ')'.repeat(scaleValues.length - 1);

        avatarScaleExpr = expr;
        console.log(`[Render] Audio analysis done — ${scaleValues.length} keyframes, range ${Math.min(...scaleValues)}-${Math.max(...scaleValues)}px`);
      }
    } catch (err) {
      console.warn('[Render] Audio analysis failed, falling back to sine pulse:', err);
    }

    await new Promise(async (resolve, reject) => {
      let reactionPath = null;
      if (reactionFaceFile && characterSelect === 'custom') {
        const ext = reactionFaceFile.name.split('.').pop() || 'png';
        reactionPath = path.join(tmpDir, `reaction.${ext}`);
        fs.writeFileSync(reactionPath, Buffer.from(await reactionFaceFile.arrayBuffer()));
      } else {
        const publicAvatar = path.join(process.cwd(), 'public', `${characterSelect}.png`);
        if (fs.existsSync(publicAvatar)) {
          reactionPath = publicAvatar;
        } else {
          const fallbackAvatar = path.join(process.cwd(), 'public', 'reaction_avatar.png');
          if (fs.existsSync(fallbackAvatar)) reactionPath = fallbackAvatar;
        }
      }

      // Execute from tmpDir so subtitles=captions.srt can be found without path escaping issues
      const finalCmd = ffmpeg({ cwd: tmpDir }).input(mergedVideoPath).input(voPath);
      let currentInputIndex = 2;
      
      let bgAudioIndex = -1;
      if (bgPath) {
        finalCmd.input(bgPath).inputOptions(['-stream_loop', '-1']);
        bgAudioIndex = currentInputIndex++;
      }
      
      let reactionIndex = -1;
      if (reactionPath) {
        finalCmd.input(reactionPath).inputOptions(['-stream_loop', '-1']);
        reactionIndex = currentInputIndex++;
      }
      
      let filterComplexStr = '';
      if (bgAudioIndex !== -1) {
        filterComplexStr += `[1:a]volume=1.0[vo];[${bgAudioIndex}:a]volume=${bgmVolume}[bg];[vo][bg]amix=inputs=2:duration=first[a];`;
      } else {
        filterComplexStr += `[1:a]volume=1.0[a];`;
      }

      filterComplexStr += `[0:v]ass=captions.ass[v_sub];`;

      if (reactionIndex !== -1) {
        let overlayX = '40';
        let overlayY = '40';
        if (reactionFacePosition === 'bottom-right') { overlayX = 'W-w-40'; overlayY = 'H-h-40'; }
        else if (reactionFacePosition === 'bottom-left') { overlayX = '40'; overlayY = 'H-h-40'; }
        else if (reactionFacePosition === 'top-right') { overlayX = 'W-w-40'; overlayY = '40'; }
        else if (reactionFacePosition === 'top-left') { overlayX = '40'; overlayY = '40'; }
        
        // Add a lavfi white source to generate the circle alpha mask from
        finalCmd.input('color=c=white:s=300x300').inputOptions(['-f', 'lavfi', '-stream_loop', '-1']);
        const maskIndex = currentInputIndex++;

        // Step 1: Scale & square-crop the avatar, convert to RGBA
        filterComplexStr += `[${reactionIndex}:v]scale=300:300:force_original_aspect_ratio=increase,crop=300:300,format=rgba[avatar_sq];`;

        // Step 2: Generate a white circle on black background using geq pure math (no pixel reads)
        // This only uses constant values and coordinate math, which works in all FFmpeg builds
        filterComplexStr += `[${maskIndex}:v]format=rgba,geq=r=255:g=255:b=255:a='if(lte((X-150)*(X-150)+(Y-150)*(Y-150),150*150),255,0)'[circle_mask];`;

        // Step 3: alphamerge to get a perfect circle avatar
        filterComplexStr += `[avatar_sq][circle_mask]alphamerge[circle_avatar];`;

        // Step 4: Scale using real audio-amplitude data (piecewise linear interpolated)
        filterComplexStr += `[circle_avatar]scale=w='${avatarScaleExpr}':h='${avatarScaleExpr}'[avatar];`;

        filterComplexStr += `[v_sub][avatar]overlay=x=${overlayX}:y=${overlayY}[v]`;
      } else {
        filterComplexStr += `[v_sub]null[v]`;
      }

      console.log('[Render] filterComplexStr:', filterComplexStr);
      finalCmd.complexFilter(filterComplexStr.replace(/;$/, ''))
        .outputOptions(['-map [v]', '-map [a]', '-shortest'])
        .videoCodec('libx264')
        .save(finalPath)
        .on('end', resolve)
        .on('error', (err) => {
          console.error("[Render] Compositing Error:", err);
          reject(err);
        });
    });

    console.log(`[Render] Complete! Sending file to user.`);

    // 5. Send file back to client
    const fileBuffer = fs.readFileSync(finalPath);
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'attachment; filename="final_short.mp4"'
      }
    });

  } catch (error: any) {
    console.error("Render Error:", error);
    return NextResponse.json({ error: error.message || "Failed to render video" }, { status: 500 });
  } finally {
    // Cleanup temporary files
    if (tmpDir && fs.existsSync(tmpDir)) {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch (e) {
        console.error("Failed to clean up tmp dir:", e);
      }
    }
  }
}

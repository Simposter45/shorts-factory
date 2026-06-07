import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import https from 'https';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

async function run() {
  const imgUrl = 'https://upload.wikimedia.org/wikipedia/commons/e/e1/FullMoon2010.jpg';
  
  // download image
  const res = await fetch(imgUrl);
  if (!res.ok) throw new Error("Fetch failed");
  const buffer = await res.arrayBuffer();
  fs.writeFileSync('test.jpg', Buffer.from(buffer));

  console.log("Image downloaded. Starting FFmpeg...");

  await new Promise((resolve, reject) => {
    const cmd = ffmpeg();
    cmd.input('test.jpg')
       .inputOptions(['-loop 1', '-framerate 30'])
       .setDuration(7);
       
    cmd.videoCodec('libx264')
       .size('1080x1920')
       .autoPad()
       .fps(30)
       .outputOptions(['-pix_fmt yuv420p'])
       .save('test_out.mp4')
       .on('start', (commandLine) => console.log('Spawned FFmpeg with command: ' + commandLine))
       .on('end', resolve)
       .on('error', reject);
  });
  
  console.log("Done.");
}

run().catch(console.error);

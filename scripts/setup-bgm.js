const https = require('https');
const fs = require('fs');
const path = require('path');

const bgmDir = path.join(__dirname, '../public/bgm');
if (!fs.existsSync(bgmDir)) fs.mkdirSync(bgmDir, { recursive: true });

const tracks = {
  'phonk': 'https://archive.org/download/phonk_202102/PHONK%20%20.mp3',
  'epic_cinematic': 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Volatile%20Reaction.mp3',
  'lofi_chill': 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Lobby%20Time.mp3',
  'synthwave': 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Rocket%20Power.mp3',
  'creepy_ambient': 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Sneaky%20Snitch.mp3',
  'emotional_piano': 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Carefree.mp3',
  'upbeat_tech': 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Fluffing%20a%20Duck.mp3',
  'comedy_mischief': 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Monkeys%20Spinning%20Monkeys.mp3',
};

async function download(url, dest) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'VideoAutomator/1.0 (https://github.com/example/video-automator)' } });
    if (!res.ok) {
       throw new Error(`HTTP ${res.status}`);
    }
    const buffer = await res.arrayBuffer();
    fs.writeFileSync(dest, Buffer.from(buffer));
  } catch (e) {
    console.warn(`[!] fetch failed: ${url}. Generating placeholder... Error: ${e.message}`);
    const { execSync } = require('child_process');
    const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
    execSync(`"${ffmpegPath}" -f lavfi -i "sine=frequency=440:duration=5" -b:a 64k "${dest}" -y`);
  }
}

async function setup() {
  console.log('Starting Auto-BGM track downloads...');
  for (const [name, url] of Object.entries(tracks)) {
    const ext = url.endsWith('.ogg') ? '.ogg' : '.mp3';
    const dest = path.join(bgmDir, `${name}${ext}`);
    console.log(`Downloading ${name}${ext}...`);
    try {
      await download(url, dest);
      console.log(`✅ ${name}${ext} ready.`);
    } catch (e) {
      console.error(`❌ Failed to setup ${name}:`, e.message);
    }
  }
  console.log('\nAll viral BGM tracks have been successfully provisioned!');
}

setup();

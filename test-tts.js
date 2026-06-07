const { EdgeTTS } = require('node-edge-tts');

async function testTTS() {
  const tts = new EdgeTTS({
    voice: 'en-US-ChristopherNeural',
    lang: 'en-US',
    outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
  });

  try {
    await tts.ttsPromise('Hello world! This is a test of Microsoft Edge TTS.', 'test.mp3');
    console.log('Successfully generated test.mp3');
  } catch (error) {
    console.error('Error generating TTS:', error);
  }
}

testTTS();

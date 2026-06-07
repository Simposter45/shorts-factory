const https = require('https');

https.get('https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100327', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const matches = data.match(/href="([^"]+\.mp3)"/g);
    console.log('Matches:', matches);
  });
});

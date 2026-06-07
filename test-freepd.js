const https = require('https');

https.get('https://freepd.com/music/', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const matches = data.match(/href="([^"]+\.mp3)"/g);
    console.log('Matches:', matches ? matches.slice(0, 10) : 'none');
  });
});

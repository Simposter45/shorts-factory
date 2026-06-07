const https = require('https');

https.get('https://pixabay.com/music/search/phonk/', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    // try to extract some mp3 urls
    const matches = data.match(/https:\/\/cdn\.pixabay\.com\/audio\/[^"']+\.mp3/g);
    if (matches) {
      console.log('Found URLs:', [...new Set(matches)]);
    } else {
      console.log('No URLs found.');
    }
  });
});

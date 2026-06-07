const https = require('https');
https.get('https://archive.org/metadata/phonk_202102', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(JSON.parse(data).files.slice(0, 3));
  });
});

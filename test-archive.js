const https = require('https');

https.get('https://archive.org/advancedsearch.php?q=phonk+AND+mediatype:audio&fl[]=identifier&output=json', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(data.substring(0, 500));
  });
});

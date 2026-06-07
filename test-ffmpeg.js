const ffmpeg = require('fluent-ffmpeg'); 
const path = require('ffmpeg-static'); 
ffmpeg.setFfmpegPath(path); 
ffmpeg('color=c=black:s=100x100').inputFormat('lavfi').videoFilters("zoompan=z='1.1':d=40.2").frames(1).save('test.jpg').on('error', console.log)

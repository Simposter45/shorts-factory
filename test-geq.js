const ffmpeg = require('fluent-ffmpeg'); 
const path = require('ffmpeg-static'); 
ffmpeg.setFfmpegPath(path); 
ffmpeg('color=c=black:s=100x100').inputFormat('lavfi').complexFilter("format=rgba,geq=r='r(X,Y)'").frames(1).save('test.jpg').on('error', console.log)

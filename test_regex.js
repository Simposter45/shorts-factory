const fs = require('fs');

function parseTimestamps(text, assetType) {
  if (!text) return [];
  const lines = text.split('\n');
  const results = [];
  for (const line of lines) {
    const match = line.match(/(\d+):(\d+)[^\d]+(\d+):(\d+)(.*)/);
    if (match) {
      const startMin = parseInt(match[1]);
      const startSec = parseInt(match[2]);
      const endMin = parseInt(match[3]);
      const endSec = parseInt(match[4]);
      
      const startTime = startMin * 60 + startSec;
      const endTime = endMin * 60 + endSec;
      const duration = endTime - startTime;
      
      let query = match[5];
      // strip any pipe content after the first part
      // Actually we want to find the query part. If there is a quote, take it.
      const quoteMatch = query.match(/["'](.*?)["']/);
      if (quoteMatch) {
         query = quoteMatch[1];
      } else {
         if (query.includes('|')) query = query.split('|')[0];
         query = query.replace(/\b(?:Search|Query|Video|Image|Clip)\b/ig, '');
         query = query.replace(/^[\s:|\\-]+/g, '');
         query = query.trim();
      }
      
      if (query && duration > 0) {
        results.push({ startTime, endTime, duration, searchQuery: query, assetType });
      }
    }
  }
  return results;
}

function parseBRoll(text) {
  if (!text) return [];
  const lines = text.split('\n');
  const overrides = [];
  for (const line of lines) {
    const queryMatch = line.match(/Search:\s*["'](.*?)["']/i);
    const useMatch = line.match(/Use:\s*(.*)/i);
    if (queryMatch && useMatch) {
      const query = queryMatch[1];
      const scenesStr = useMatch[1];
      const sceneNums = [];
      const numMatches = scenesStr.match(/\d+/g);
      if (numMatches) {
        for (const n of numMatches) {
           sceneNums.push(parseInt(n) - 1); // 0-indexed
        }
      }
      overrides.push({ query, scenes: sceneNums });
    }
  }
  return overrides;
}

const content = fs.readFileSync('Full_script_example.md', 'utf-8');
let s4 = [], s5 = [], s6 = [], s2 = [];
let mode = 0;
for (const line of content.split('\n')) {
  if (line.includes('2. VOICEOVER ONLY')) mode = 2;
  else if (line.includes('3. TEXT OVERLAYS')) mode = 3;
  else if (line.includes('4. REAL VIDEO CLIPS')) mode = 4;
  else if (line.includes('5. REAL IMAGES')) mode = 5;
  else if (line.includes('6. B-ROLL')) mode = 6;
  else if (line.trim() !== '') {
    if (mode === 2) s2.push(line);
    if (mode === 4) s4.push(line);
    if (mode === 5) s5.push(line);
    if (mode === 6) s6.push(line);
  }
}

const allClips = [
  ...parseTimestamps(s4.join('\n'), 'b-roll'),
  ...parseTimestamps(s5.join('\n'), 'specific')
].sort((a, b) => a.startTime - b.startTime);

const bRolls = parseBRoll(s6.join('\n'));
for (const b of bRolls) {
  for (const sIndex of b.scenes) {
    if (allClips[sIndex]) {
      allClips[sIndex].searchQuery = b.query;
      allClips[sIndex].assetType = 'b-roll';
    }
  }
}

const voiceovers = s2.join('\n').split('\n').filter(l => l.trim());
for (let i = 0; i < allClips.length; i++) {
  allClips[i].description = voiceovers[i] || allClips[i].searchQuery;
}

console.log(allClips);

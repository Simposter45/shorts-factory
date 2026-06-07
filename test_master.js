const fs = require('fs');

function parseMasterTimeline(text) {
  if (!text) return [];
  const lines = text.split('\n');
  const results = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    const match = line.match(/(\d+):(\d+)[^\d]+(\d+):(\d+)\s*\|\s*(.*)/);
    if (match) {
      const startMin = parseInt(match[1]);
      const startSec = parseInt(match[2]);
      const endMin = parseInt(match[3]);
      const endSec = parseInt(match[4]);
      
      const startTime = startMin * 60 + startSec;
      const endTime = endMin * 60 + endSec;
      const duration = endTime - startTime;
      
      const parts = match[5].split('|').map(p => p.trim());
      
      let type = 'VIDEO';
      let search = '';
      let domain = '';
      let voiceover = '';
      
      for (const part of parts) {
        const colonIdx = part.indexOf(':');
        if (colonIdx === -1) continue;
        const key = part.slice(0, colonIdx).trim().toUpperCase();
        const val = part.slice(colonIdx + 1).trim();
        
        if (key === 'TYPE') type = val;
        else if (key === 'SEARCH') search = val.replace(/^["']|["']$/g, '');
        else if (key === 'DOMAIN') domain = val;
        else if (key === 'VOICEOVER') voiceover = val;
      }
      
      if (domain) {
         search = `${search} site:${domain}`;
      }
      
      results.push({
        startTime,
        duration,
        type,
        searchQuery: search,
        voiceover
      });
    }
  }
  return results;
}

const text = `0:00–0:04 | TYPE: VIDEO | SOURCE: Pexels | Search: "soccer player injury medical staff" | Voiceover: The World Cup hasn't even started — and the injury list is already massive.

0:04–0:08 | TYPE: IMAGE | Search: "Lionel Messi Argentina kit 2026" | Domain: wikipedia.org | Ken Burns: Slow zoom in | Voiceover: Messi left the field injured for Inter Miami. Argentina are sweating.`;

console.log(parseMasterTimeline(text));

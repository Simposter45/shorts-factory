const fs = require('fs');
let lines = fs.readFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', 'utf8').split('\n');

// The structure should be:
// line 1455 (idx): </div>  -- close subtitles list
// line 1456:       </div>  -- close right panel  
// line 1457:      </div>   -- close main flex row
// [MISSING: the timeline and render btn need to be inside result-section but AFTER the main flex row]
// line 1458:    </div>     -- THIS is currently closing result-section too early
// line 1459: empty
// line 1460: {/* Bottom: Timeline */}  -- This is outside result-section!

// Fix: Remove the extra closing div at line 1457 (0-indexed)
// line 1457 is 0-indexed 1457 => index 1457
// Actually index is 0-based so line 1458 = index 1457

console.log('Current line 1456 (idx 1455):', JSON.stringify(lines[1455]));
console.log('Current line 1457 (idx 1456):', JSON.stringify(lines[1456]));
console.log('Current line 1458 (idx 1457):', JSON.stringify(lines[1457]));

// Remove line at index 1457 (the extra </div> at 10-space indent)
if (lines[1457] === '          </div>') {
  lines.splice(1457, 1);
  console.log('Removed extra closing div');
  
  // Now also need to add it back at the end of timeline/render button, after line ~1693
  // Find the render button's closing div
  for (let i = 1690; i < 1700; i++) {
    if (lines[i] === '            </div>') {
      // This is the closing div of the render button wrapper div
      lines.splice(i + 1, 0, '          </div>');
      console.log('Inserted missing closing div at line', i + 2);
      break;
    }
  }
} else {
  console.log('Line 1458 is NOT the expected tag:', JSON.stringify(lines[1457]));
}

fs.writeFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', lines.join('\n'));
console.log('Done');

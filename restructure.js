const fs = require('fs');
const filePath = 'c:/Users/user/Downloads/video-automator/app/page.tsx';
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Find right panel start
let startIdx = -1;
for(let i=930; i<950; i++) {
  if(lines[i].includes('<div style={{ flex: 1, display: \'flex\', flexDirection: \'column\', overflowY: \'auto\', padding: \'16px\', gap: \'16px\', background: \'#0f172a\' }}>')) {
    startIdx = i;
    break;
  }
}

if (startIdx !== -1) {
  lines[startIdx] = `            {/* RIGHT COLUMN: Wrapper for Controls and Timeline */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0f172a' }}>
              {/* Scrollable controls panel */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '16px', gap: '16px' }}>`;
}

// Find right panel end.
// At line 1456 it is `              </div>`
// At line 1457 it is `            </div>`
// At line 1458 it is empty
// At line 1459 it is `            <div style={{ height: '280px', flexShrink: 0...`
// I need to find the `</div>` that closed the right panel, which is line 1456's </div>
// and move the timeline INSIDE this right column, and also move the main flex row's </div> to AFTER the render button.

// Actually, wait, let's just find the `          </div>` that closes the main flex row, which should be around 1456.
let endIdx = -1;
for(let i=1450; i<1470; i++) {
  if (lines[i].includes('            </div>') && lines[i+2] && lines[i+2].includes('Timeline')) {
    // This is the `</div>` closing the right panel
    endIdx = i;
    break;
  }
}

// Let's do it with replacing text to be safer
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /<div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '16px', gap: '16px', background: '#0f172a' }}>/,
  `{/* RIGHT COLUMN */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0f172a' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '16px', gap: '16px' }}>`
);

content = content.replace(
  /\n\s*\{\/\* Bottom: Timeline \*\/\}/,
  `
              </div> {/* End scrollable controls panel */}
              {/* Bottom: Timeline */}`
);

// We still need to close the RIGHT COLUMN div, and the MAIN FLEX ROW div.
// Right now, before {/* Bottom: Timeline */}, there are three closing divs:
//                 </div>
//               </div>
//             </div>
// Let's replace the whole block right before timeline.

content = content.replace(
  /                  \)\}\n                <\/div>\n              <\/div>\n            <\/div>\n\n            \{\/\* Bottom: Timeline \*\/\}/,
  `                  )}
                </div>
              </div>
            </div>
            {/* End scrollable controls panel */}

            {/* Bottom: Timeline */}`
);

// We need to find the end of the Render button and add the closing divs there.
// Currently the render button ends around line 1685
//            </div>
//          </div>
//        )}
// The last closing div `          </div>` closed the result-section.
// Wait, the main flex row was never explicitly closed if we removed it from above Timeline!
// We actually need:
//             </div> {/* End RIGHT COLUMN */}
//           </div> {/* End MAIN FLEX ROW */}
//         </div> {/* End result-section */}
//       )}

content = content.replace(
  /              <\/button>\n            <\/div>\n          <\/div>\n        \)\}/,
  `              </button>
            </div>
            </div> {/* End RIGHT COLUMN */}
          </div> {/* End MAIN FLEX ROW */}
        </div> {/* End result-section */}
      )}`
);

fs.writeFileSync('c:/Users/user/Downloads/video-automator/app/page.tsx', content);
console.log('Restructured columns');

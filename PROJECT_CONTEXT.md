# Video Automator: Project Context & Handoff

**Project Goal:** A fully automated Next.js web application designed to replace CapCut for daily short-form vertical video creation. It takes a structured script, automatically sources raw media, provides an interactive timeline/preview, and renders a final 9:16 `.mp4` video locally using FFmpeg.

---

## 1. What Has Been Completed

### Phase 1 & 2: Base UI, Asset Sourcing & Timeline
*   **Media Scraper:** Uses a server-side DuckDuckGo image proxy (`/api/search-media`) to automatically gather images and videos, bypassing CORS and blocking paid stock sites. It has an auto-healing mechanism: if an image is blocked by captchas, it searches for a new one, eventually falling back to a high-quality `picsum.photos` stock image to guarantee no "black frames" are rendered.
*   **Interactive Frontend:** Features a visual Video Player mock and a drag-and-drop timeline. It accurately calculates Voiceover audio lengths and stretches the UI track to match.

### Phase 3: Advanced FFmpeg Engine (Backend)
*   **The Render API (`/api/render/route.ts`):** 
    1. Downloads all remote assets locally to `os.tmpdir()`.
    2. Normalizes everything to a strict 1080x1920 (9:16) 30fps canvas. It applies `setsar=1` and `format=yuv420p` to prevent FFmpeg pipeline crashes.
    3. Handles real `.mp4` clips by injecting `-stream_loop -1` so short videos dynamically stretch to fill their allocated timeline duration without crashing the transition engine.
    4. Applies a subtle "Ken Burns" Zoom/Pan effect to all static images.
    5. Implements a robust `xfade` engine for smooth crossfades, with an automated fallback to hard cuts if `xfade` rejects the media.
    6. **.ASS Subtitles Engine:** Completely ripped out standard `.srt` generation and built a custom Advanced SubStation Alpha (`.ass`) caption engine. This hardcodes the text resolution to exactly 1080x1920, preventing subtitles from blowing up and covering the entire screen. It includes a custom word-wrap algorithm (max 35 chars) and explicitly sets font size, outlines, and drop shadows to perfectly mimic modern TikTok/Shorts captions.

---

## 2. Blueprint for Tomorrow: The "Claude" Architecture Overhaul

The user has decided to use Claude to write highly-structured "Director's Cut" scripts, and wants the app optimized to process them natively. 

### Goal 1: The Multi-Input UI & The 6 Claude Sections
The frontend (`app/page.tsx`) needs to be completely redesigned to accept the exact output from Claude. We will replace the single "Prompt" text area with specific input areas that map to the 6 sections Claude provides:
1.  **FULL SCRIPT:** (Contextual only, used for understanding the flow).
2.  **VOICEOVER ONLY:** A text block explicitly used for generating the `.ass` subtitles, perfectly syncing the words to the screen.
3.  **TEXT OVERLAYS:** A structured list of texts to be rendered natively onto the video (e.g., `LOWER THIRD at 0:13 (4 seconds): GERMANY: 8 WINS IN A ROW`). This will require injecting FFmpeg `drawtext` filters at specific timestamps to make the video generation substantially more professional.
4.  **REAL VIDEO CLIPS WITH TIMINGS:** A structured list of exact timestamps and YouTube/search queries (e.g., `0:00-0:04 | Search: "Soldier Field crowd roar"`).
5.  **REAL IMAGES WITH TIMINGS:** Similar to video clips but explicitly sourcing static imagery.
6.  **B-ROLL CLIPS:** Backup/filler generic clips from Pexels/Pixabay to cover any missing primary footage.

### Goal 2: The Zero-Gemini Claude Parser
Because Claude already provides the exact search queries, timestamps, and durations in Sections 4 & 5, **we no longer need to use Gemini to guess the timeline structure**. 
*   We need to build a custom Javascript Regex Parser in the backend (or frontend) that slices the pasted Claude text and directly builds the `Scene` JSON objects.
*   This drops the user's Gemini API usage for manual generation to **0 per video**, bypassing their 20 request/day quota issue entirely.

### Goal 3: "Generate with Gemini" Auto-Fill Feature (Smart API Usage)
While manual copying from Claude is the primary workflow, the user still has 20 free Gemini calls a day and wants to utilize them wisely.
*   We will add a **"Generate with Gemini"** button at the very top of the new UI.
*   If the user has a quick idea but doesn't want to open Claude, they can type a single concept (e.g., "30s video on Messi").
*   We will send this single prompt to the Gemini API, instructing it to output the **exact 6-section format** that Claude does.
*   The system will then automatically fill all 6 UI text areas for the user.
*   **Search Query Refiner:** We can also use Gemini calls to dynamically refine Claude's raw search queries. If Claude suggests `Search: "Christian Pulisic goal USMNT 2025"`, we can ping Gemini to optimize it into a much more search-engine-friendly boolean string (e.g., `"Pulisic" AND "goal" -training`) to guarantee better hits from DuckDuckGo and Pexels.
*   This provides a massive quality-of-life feature, allowing the user to seamlessly switch between manual Claude processing (0 API calls) and quick in-app Gemini generation/refinement (1 API call) based on their daily quota.

---

## 3. Phase 4 Accomplishments (Completed in the current session)

### Audio Engine & BGM Fixes
*   **Infinite BGM Looping:** Updated the FFmpeg compositor (`/api/render/route.ts`) to inject `-stream_loop -1` into the background music input. This ensures that no matter how long the final video is, the BGM track will automatically loop infinitely until the video strictly cuts off, preventing "dead silence" at the end of clips.
*   **Robust BGM Provisioning Script:** The `scripts/setup-bgm.js` script was completely overhauled. Previous Wikimedia/Archive.org links were getting blocked with 403 Forbidden errors and causing the script to secretly fallback to a 5-second 440Hz "beep" sine wave. The script now uses native Node 18+ `fetch()` with proper `.arrayBuffer()` piping and connects to reliable direct `.mp3` links from Incompetech, guaranteeing 8 unique, high-quality viral tracks.
*   **Flexible Extension Resolution:** The backend rendering API dynamically checks for both `.mp3` and `.ogg` extensions using `fs.existsSync` so it never crashes if track formats change. The frontend preview player was also updated to seamlessly load the correct `.mp3` background tracks.

### UI & Timeline Stability
*   **Responsive Settings Panel:** Fixed severe overlapping/wrapping issues in the Audio Settings and Voiceover panels. Implemented flexbox wrap mechanics so the Background Music and Voiceover columns stack elegantly on smaller monitor views without pushing boxes out of the border.
*   **Timeline Flicker & Re-render Bug Fixed:** Local file uploads (custom videos) were mysteriously disappearing and reappearing from the timeline. This was due to a severe performance bug where `URL.createObjectURL()` was being called directly inside the React render cycle (60 times a second), causing rapid garbage collection and browser flickering. Hoisted the Blob URLs into a stable React `useState` cache layer, immediately stabilizing local file rendering.

### FFmpeg Avatar & Compositing Stabilization
*   **Node.js Circle Mask Generation:** Ripped out the fragile FFmpeg `geq` pixel-math filter (which broke across different Windows FFmpeg builds) for creating circular avatars. Replaced it with pure Node.js `zlib` grayscale PNG alpha mask generation, guaranteeing 100% robust perfect circle cutouts before feeding into `alphamerge`.
*   **Eliminated Filter Re-initialization Crashes:** Solved a fatal `Error reinitializing filters!` FFmpeg crash caused by the audio-reactive avatar dynamically scaling size (`scale:eval=frame`) which broke downstream compositor buffers. Transitioned to a fixed 300x300 avatar scale with a dynamic vertical bouncing offset (`overlay=y='...+bounce':eval=frame`), which delivers smooth audio-reactive animation entirely crash-free.
*   **Windows Path Escaping Bypass:** Fixed FFprobe crashing over the `C:\` drive letter in complex filter graphs by restructuring the process to execute directly within `os.tmpdir()` and reading a clean relative `vo.mp3` string.
*   **Robust State Handling for Local Clips:** Fixed an issue where local video uploads were previewed via browser Blobs but failed during rendering because they were never appended to the React state array. Local clips are now fully tracked, correctly packaged into `FormData`, and successfully processed by the Node.js rendering engine. Added a visual `📁 attached` green badge to scenes so the user knows local files are strictly bound.
*   **Clean Toggle State:** Built a dedicated `Avatar ON/OFF` toggle into the UI that elegantly overrides compositor filters, entirely skipping the avatar pipeline when disabled.

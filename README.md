# Video Asset Automator (Phase 1)

This project handles the first phase of your video compilation pipeline: parsing a prompt into a storyboard, fetching relevant media clips/images, and providing audio pairing suggestions (FIFA trending tracks) to go with your ElevenLabs voiceovers.

## Tech Stack
- **Framework:** Next.js (App Router)
- **Language:** TypeScript (Strict, zero-any enforced)
- **Styling:** Inline `<style>` components (No Tailwind in JSX, keeping component logic isolated)

## Setup Instructions

1. Run `npm install` to install Next.js, React, and TypeScript dependencies.
2. Run `npm run dev` to start the local server.
3. Open `http://localhost:3000` to test the storyboard UI.

## Architecture

- `app/page.tsx`: Contains the main UI and client-side logic.
- `app/api/storyboard/route.ts`: API Route handler. Currently uses mock data for the LLM breakdown and image fetching. 
  - **Next Step:** Swap the `generateStoryboardSegments` logic with an actual API call to OpenAI/Gemini to process the prompt dynamically.
  - **Next Step:** Swap `fetchMockMedia` with the official Pexels API (`pexels.com/api`) to grab actual stock `.mp4` files.
- `types/index.ts`: Strongly typed interfaces.

## Commit Standards
When expanding on this codebase, please adhere to standard commit prefixes:
- `FEAT:` New features
- `BUG:` Bug fixes
- `REFACT:` Code restructuring
- `CHORE:` Dependency updates or config changes

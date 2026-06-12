export interface TextOverlay {
  text: string;
  startTime: number;
  duration: number;
  position?: 'top' | 'middle' | 'bottom';
}

export interface Scene {
  id: string;
  description: string;
  searchQuery: string;
  assetType: 'specific' | 'b-roll';
  mediaUrl: string | null;
  mediaStartTime?: number;
  duration: number;
  maxDuration?: number;
  textOverlay?: TextOverlay;
  animation?: 'none' | 'zoom-in' | 'zoom-out' | 'pan-left-right' | 'pan-right-left';
  transitionNext?: boolean;
  isReveal?: boolean;
  revealTime?: number;
  customPrompt?: string;
  auraFilter?: boolean;
}

export interface SubtitleClip {
  id: string;
  text: string;
  startTime: number;
  duration: number;
}

export interface StoryboardResponse {
  scenes: Scene[];
  voiceoverSubtitles: SubtitleClip[];
  musicSuggestions: string[];
  wordTimings?: { part: string, start: number, end: number }[];
}

export interface GenerateRequest {
  prompt: string;
}

export interface ClaudeSections {
  fullScript?: string;
  voiceoverOnly: string;
  textOverlays?: string;
  masterTimeline: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  prompt?: string;
  sections?: ClaudeSections;
  result: StoryboardResponse;
}

import { NextResponse } from 'next/server';
import ytSearch from 'yt-search';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 });

    const r = await ytSearch(query);
    if (r && r.videos && r.videos.length > 0) {
      const topVideos = r.videos.slice(0, 10).map((v) => ({
        videoId: v.videoId,
        title: v.title,
        thumbnail: v.thumbnail,
        duration: v.timestamp,
        url: 'https://www.youtube.com/watch?v=' + v.videoId
      }));
      return NextResponse.json({ videos: topVideos });
    }
    
    return NextResponse.json({ error: "No videos found" }, { status: 404 });
  } catch (error) {
    console.error("YouTube Search API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

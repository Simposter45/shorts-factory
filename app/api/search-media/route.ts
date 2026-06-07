import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { query, currentUrl } = await request.json();
    if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 });

    const optimizedQuery = query;
    const resToken = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(optimizedQuery)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await resToken.text();
    const vqdMatch = html.match(/vqd=([\d-]+)/);
    
    if (!vqdMatch) return NextResponse.json({ error: "Could not fetch search token" }, { status: 500 });
    
    const vqd = vqdMatch[1];
    const resSearch = await fetch(`https://duckduckgo.com/i.js?q=${encodeURIComponent(optimizedQuery)}&o=json&vqd=${vqd}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    const data = await resSearch.json();
    if (data.results && data.results.length > 0) {
      const blockedDomains = ['alamy', 'getty', 'shutterstock', 'istock', 'dreamstime', 'depositphotos'];
      const validResults = data.results.filter((result: any) => {
        const urlLower = result.image.toLowerCase();
        return !blockedDomains.some(domain => urlLower.includes(domain)) && result.image !== currentUrl;
      });
      
      if (validResults.length > 0) {
        const topN = Math.min(validResults.length, 10);
        const randomIndex = Math.floor(Math.random() * topN);
        return NextResponse.json({ url: validResults[randomIndex].image });
      }
      // Fallback
      return NextResponse.json({ url: data.results[0].image });
    }
    
    return NextResponse.json({ error: "No images found" }, { status: 404 });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

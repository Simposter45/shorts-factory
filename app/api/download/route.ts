import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
    
    const arrayBuffer = await res.arrayBuffer();
    const headers = new Headers();
    headers.set('Content-Type', res.headers.get('Content-Type') || 'application/octet-stream');
    headers.set('Access-Control-Allow-Origin', '*');
    
    return new NextResponse(arrayBuffer, { headers });
  } catch (error) {
    console.error("Proxy Download Error:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

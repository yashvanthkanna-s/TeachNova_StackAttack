import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const repoName = searchParams.get('repoName');
  const panelId = searchParams.get('panelId');

  if (!repoName || !panelId) {
    return new NextResponse('Missing parameters', { status: 400 });
  }

  // Use the Grafana Render API directly. We use from=now-1y to ensure we catch ALL data regardless of timezone issues.
  const grafanaUrl = `https://mellowstarfish834.grafana.net/render/d-solo/yagvm9h/new-dashboard?orgId=1&from=now-1y&to=now&theme=dark&var-repo_name=${encodeURIComponent(repoName)}&panelId=${panelId}&width=800&height=400`;

  try {
    const response = await fetch(grafanaUrl, {
      headers: {
        // This securely authenticates the request from the server, hiding the key from the browser
        'Authorization': `Bearer ${process.env.GRAFANA_API_KEY}`
      }
    });

    if (!response.ok) {
      console.error(`Grafana Render Error: ${response.status} ${response.statusText}`);
      return new NextResponse('Grafana authentication failed. Check API key.', { status: response.status });
    }

    const imageBuffer = await response.arrayBuffer();

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    console.error('Grafana Proxy Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

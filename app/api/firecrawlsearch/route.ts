import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

type FirecrawlSearchItem = {
  title?: string;
  url?: string;
  description?: string;
  markdown?: string;
  metadata?: {
    title?: string;
    sourceURL?: string;
    url?: string;
  };
};

type FirecrawlSearchResponse = {
  success?: boolean;
  error?: string;
  data?: {
    web?: FirecrawlSearchItem[];
  };
};

function buildContextualQuery(query: string, previousQueries: string[]) {
  if (!previousQueries.length) return query;

  const context = previousQueries
    .map((q) => `Previous question: ${q}`)
    .join('\n');

  return `${context}\n\nNow answer the question: ${query}`;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing FIRECRAWL_API_KEY' },
        { status: 500 }
      );
    }

    const { query, previousQueries = [] } = await req.json();
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const contextualQuery = buildContextualQuery(query, previousQueries);

    const firecrawlResponse = await fetch('https://api.firecrawl.dev/v2/search', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: contextualQuery,
        limit: 5,
        scrapeOptions: {
          formats: [{ type: 'markdown' }],
          onlyMainContent: true,
        },
      }),
    });

    if (!firecrawlResponse.ok) {
      const errorBody = await firecrawlResponse.text();
      return NextResponse.json(
        { error: `Firecrawl search failed: ${firecrawlResponse.status} ${errorBody}` },
        { status: 500 }
      );
    }

    const firecrawlData = (await firecrawlResponse.json()) as FirecrawlSearchResponse;
    const items = firecrawlData.data?.web ?? [];

    const results = items
      .filter((item) => item.url || item.metadata?.sourceURL || item.metadata?.url)
      .map((item) => ({
        title: item.title || item.metadata?.title || 'Untitled source',
        url: item.url || item.metadata?.sourceURL || item.metadata?.url || '',
        text: item.markdown || item.description || '',
      }));

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to perform search | ${error}` },
      { status: 500 }
    );
  }
}

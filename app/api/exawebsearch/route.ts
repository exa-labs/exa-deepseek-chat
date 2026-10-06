// app/api/exawebsearch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Exa from "exa-js";

export const maxDuration = 60;

const exa = new Exa(process.env.EXA_API_KEY as string);

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  try {
    const { query, previousQueries = [] } = await req.json();
    console.log(`[audit] ${new Date().toISOString()} exawebsearch request ip=${clientIp} query=${JSON.stringify(query)}`);
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Format previous queries as context
    let contextualQuery = query;
    if (previousQueries.length > 0) {
      const context = previousQueries
        .map((q: string) => `Previous question: ${q}`)
        .join('\n');
      contextualQuery = `${context}\n\nNow answer the question: ${query}`;
    }

    // Use Exa to search for content related to the claim
    const result = await exa.searchAndContents(
      contextualQuery,
      {
        type: "auto",
        text: true,
        numResults: 5,
        // livecrawl: "always",
      }
    );

    return NextResponse.json({ results: result.results });
  } catch (error) {
    return NextResponse.json({ error: `Failed to perform search | ${error}` }, { status: 500 });
  }
}
// app/api/exawebsearch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Exa from "exa-js";

export const maxDuration = 60;

const exa = new Exa(process.env.EXA_API_KEY as string);

export async function POST(req: NextRequest) {
  try {
    // Require a valid app-level credential so anonymous callers cannot
    // consume the (paid) Exa search API without accountability.
    const providedKey = req.headers.get('x-app-secret');
    if (!process.env.APP_SECRET || providedKey !== process.env.APP_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, previousQueries = [] } = await req.json();
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
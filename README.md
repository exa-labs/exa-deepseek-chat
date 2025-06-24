AI search engine freeseek.
Uses exa api for grounding.
OpenAds integration for ad support.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 14 (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **LLM**: [Deepseek](https://www.deepseek.com/) via [Fireworks.ai](https://fireworks.ai/)
- **AI SDK**: [Vercel AI SDK](https://sdk.vercel.ai/)
- **Web Search**: [Exa API](https://exa.ai/)

## Project Structure

- `app/`: Main application directory.
  - `page.tsx`: The main chat interface.
  - `layout.tsx`: The root layout.
  - `api/`: API routes.
    - `chat/route.ts`: Handles chat requests to the LLM.
    - `exawebsearch/route.ts`: Handles web search requests using the Exa API.
- `public/`: Static assets.
- `middleware.ts`: Handles redirects for custom domains.
- `next.config.mjs`: Next.js configuration.

## Key Functionality

The application is a chat interface that uses web search to ground the LLM's responses. The flow is as follows:

1. User enters a query.
2. The application calls the `/api/exawebsearch` endpoint to get relevant web pages from the Exa API.
3. The search results are formatted into a context string.
4. The context string and the original query are sent to the `/api/chat` endpoint.
5. The backend streams the LLM's response back to the client, including a "thinking" process.

## Ads Integration

The application integrates with OpenAds via a `stratos` object.

- The ad is initialized in `app/page.tsx`.
- CSS overrides for the ad are also in `app/page.tsx`.
- The ad is called when the user submits a query.

## Running Locally

To run the application locally, you will need to:

1. Install the dependencies with `npm install`.
2. Create a `.env.local` file and add your Exa API key:
   ```
   EXA_API_KEY=your_exa_api_key
   ```
3. Run the development server with `npm run dev`.

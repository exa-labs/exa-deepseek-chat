# Example: Basic Usage

This example shows how to use Exa & Deepseek Chat App API in a minimal setup.

```ts
import { createChatClient } from 'exa-deepseek-chat';

// Initialize client with your API keys
const client = createChatClient({
  exaApiKey: process.env.EXA_API_KEY,
  deepseekApiKey: process.env.FIREWORKS_API_KEY
});

// Send a simple query
async function runExample() {
  const response = await client.ask('What is the capital of France?');
  console.log('Response:', response);
}

runExample();

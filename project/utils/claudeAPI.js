import fetch from 'node-fetch';

const apiKey = process.env.EXPO_PUBLIC_CLAUDE_API_KEY; // Load from environment variables

export async function askClaude(question) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [
        { role: "user", content: question }
      ]
    })
  });

  const data = await response.json();
  return data;
}
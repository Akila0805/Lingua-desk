// Server-side translation proxy. The Anthropic API key lives only here,
// in an environment variable — the browser never sees it.

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { system, text } = req.body || {};
  if (!system || !text) {
    res.status(400).json({ error: 'system and text are required' });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on the server.' });
    return;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        system,
        messages: [{ role: 'user', content: text }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      res.status(response.status).json({ error: errBody?.error?.message || `Anthropic API error (${response.status})` });
      return;
    }

    const data = await response.json();
    const block = data.content?.find((b) => b.type === 'text');
    if (!block) {
      res.status(502).json({ error: 'Empty translation response' });
      return;
    }
    res.status(200).json({ text: block.text.trim() });
  } catch (e) {
    res.status(502).json({ error: e.message || 'Could not reach the translation service' });
  }
}

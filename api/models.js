const {
  assertAccess,
  apiError,
  providerApiKey,
  providerConfig,
  sendJson,
} = require('./_provider');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('allow', 'GET');
    return sendJson(res, 405, { error: 'Method not allowed.' });
  }

  try {
    assertAccess(req);
    const provider = (req.query && req.query.provider || 'anthropic').toLowerCase();
    const cfg = providerConfig(provider);
    const apiKey = providerApiKey(provider);

    if (!apiKey) {
      return sendJson(res, 500, {
        error: `Missing ${cfg.envKey}. Add it in your Vercel environment variables.`,
      });
    }

    const models = await listModels(provider, apiKey);
    return sendJson(res, 200, { models });
  } catch (err) {
    const status = err.statusCode || 500;
    return sendJson(res, status, { error: err.message || 'Model refresh failed.' });
  }
};

async function listModels(provider, apiKey) {
  if (provider === 'anthropic') {
    const resp = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    });
    if (!resp.ok) await apiError(resp, 'Anthropic');
    const data = await resp.json();
    return (data.data || []).map(m => ({ id: m.id, label: m.display_name || m.id }));
  }

  if (provider === 'openai') {
    const resp = await fetch('https://api.openai.com/v1/models', {
      headers: { authorization: `Bearer ${apiKey}` },
    });
    if (!resp.ok) await apiError(resp, 'OpenAI');
    const data = await resp.json();
    return (data.data || [])
      .map(m => m.id)
      .filter(id => /^(gpt-|o\d|chatgpt-)/i.test(id))
      .filter(id => !/embedding|whisper|tts|audio|image|dall-e|moderation|realtime|transcribe/i.test(id))
      .sort()
      .map(id => ({ id, label: id }));
  }

  if (provider === 'openrouter') {
    const resp = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { authorization: `Bearer ${apiKey}` },
    });
    if (!resp.ok) await apiError(resp, 'OpenRouter');
    const data = await resp.json();
    return (data.data || []).map(m => ({ id: m.id, label: m.name || m.id }));
  }

  if (provider === 'gemini') {
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
    if (!resp.ok) await apiError(resp, 'Gemini');
    const data = await resp.json();
    return (data.models || [])
      .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map(m => {
        const id = (m.name || '').replace(/^models\//, '');
        return { id, label: m.displayName || id };
      })
      .filter(m => m.id);
  }

  throw new Error(`Unknown provider: ${provider}`);
}

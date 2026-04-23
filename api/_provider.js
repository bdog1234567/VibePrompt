const PROVIDERS = {
  anthropic: {
    label: 'Anthropic',
    envKey: 'ANTHROPIC_API_KEY',
    defaultModel: 'claude-haiku-4-5-20251001',
  },
  openai: {
    label: 'OpenAI',
    envKey: 'OPENAI_API_KEY',
    defaultModel: 'gpt-5.4-mini',
  },
  gemini: {
    label: 'Gemini',
    envKey: 'GEMINI_API_KEY',
    defaultModel: 'gemini-2.5-flash',
  },
  openrouter: {
    label: 'OpenRouter',
    envKey: 'OPENROUTER_API_KEY',
    defaultModel: 'anthropic/claude-haiku-4.5',
  },
};

function providerConfig(provider) {
  const id = (provider || '').toLowerCase();
  const cfg = PROVIDERS[id];
  if (!cfg) throw new Error(`Unknown provider: ${provider}`);
  return { id, ...cfg };
}

function providerApiKey(provider, env = process.env) {
  try {
    const cfg = providerConfig(provider);
    return (env[cfg.envKey] || '').trim();
  } catch {
    return '';
  }
}

function headerValue(headers, name) {
  if (!headers) return '';
  const lower = name.toLowerCase();
  if (typeof headers.get === 'function') return headers.get(name) || headers.get(lower) || '';
  const hit = Object.keys(headers).find(k => k.toLowerCase() === lower);
  return hit ? headers[hit] : '';
}

function assertAccess(req, env = process.env) {
  const expected = (env.VIBEPROMPT_ACCESS_TOKEN || '').trim();
  if (!expected) return;
  const actual = (headerValue(req.headers, 'x-vibeprompt-token') || '').trim();
  if (actual !== expected) {
    const err = new Error('Invalid access token.');
    err.statusCode = 401;
    throw err;
  }
}

function toAnthropicContent(content) {
  if (typeof content === 'string') return content;
  return (content || []).map(block => {
    if (block.type === 'image') {
      return {
        type: 'image',
        source: { type: 'base64', media_type: block.mediaType, data: block.data },
      };
    }
    return { type: 'text', text: block.text || '' };
  });
}

function toOpenAIContent(content) {
  if (typeof content === 'string') return content;
  return (content || []).map(block => {
    if (block.type === 'image') {
      return {
        type: 'image_url',
        image_url: { url: `data:${block.mediaType};base64,${block.data}` },
      };
    }
    return { type: 'text', text: block.text || '' };
  });
}

function toGeminiParts(content) {
  if (typeof content === 'string') return [{ text: content }];
  return (content || []).map(block => block.type === 'image'
    ? { inlineData: { mimeType: block.mediaType, data: block.data } }
    : { text: block.text || '' }
  );
}

function buildProviderRequest({ provider, apiKey, model, system, messages, origin }) {
  const cfg = providerConfig(provider);
  const chosenModel = model || cfg.defaultModel;

  if (cfg.id === 'anthropic') {
    return {
      url: 'https://api.anthropic.com/v1/messages',
      init: {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: chosenModel,
          max_tokens: 8192,
          system,
          messages: messages.map(m => ({
            role: m.role,
            content: toAnthropicContent(m.content),
          })),
        }),
      },
    };
  }

  if (cfg.id === 'openai' || cfg.id === 'openrouter') {
    const isOpenRouter = cfg.id === 'openrouter';
    return {
      url: isOpenRouter
        ? 'https://openrouter.ai/api/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions',
      init: {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`,
          ...(isOpenRouter ? {
            'http-referer': origin || 'https://vibeprompt.app',
            'x-title': 'VibePrompt',
          } : {}),
        },
        body: JSON.stringify({
          model: chosenModel,
          messages: [
            { role: 'system', content: system },
            ...messages.map(m => ({ role: m.role, content: toOpenAIContent(m.content) })),
          ],
        }),
      },
    };
  }

  if (cfg.id === 'gemini') {
    return {
      url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(chosenModel)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      init: {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: toGeminiParts(m.content),
          })),
          systemInstruction: { parts: [{ text: system }] },
        }),
      },
    };
  }

  throw new Error(`Unknown provider: ${provider}`);
}

async function apiError(resp, provider) {
  let detail = '';
  try {
    const json = await resp.json();
    detail = (json && json.error && (json.error.message || json.error)) || JSON.stringify(json).slice(0, 240);
    if (typeof detail === 'object') detail = JSON.stringify(detail).slice(0, 240);
  } catch {
    detail = (await resp.text().catch(() => '')).slice(0, 240);
  }
  const err = new Error(`${provider} API ${resp.status}: ${detail}`);
  err.statusCode = resp.status;
  throw err;
}

function extractText(provider, data) {
  if (provider === 'anthropic') return (data.content || []).map(c => c.text || '').join('');
  if (provider === 'gemini') {
    const parts = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts;
    return (parts || []).map(p => p.text || '').join('');
  }
  return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
}

function sendJson(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

module.exports = {
  PROVIDERS,
  assertAccess,
  apiError,
  buildProviderRequest,
  extractText,
  providerApiKey,
  providerConfig,
  sendJson,
};

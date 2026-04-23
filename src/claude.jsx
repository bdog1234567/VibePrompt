// claude.jsx — Browser fallback for window.claude.complete.
// On claude.ai/design the sandbox injects window.claude.complete for us.
// On a public deploy we route to whichever provider the user picked in
// Tweaks: Anthropic, OpenAI, or Google Gemini. Keys + model choices are
// stored in localStorage, per provider.

(function () {
  if (window.claude && typeof window.claude.complete === 'function') return;

  const KEY_PROVIDER = 'vp_provider';

  // One-shot migration: strip a known-bad saved Gemini model so users who
  // picked it before we could verify it don't get stuck on a 404.
  try {
    if (localStorage.getItem('vp_gemini_model') === 'gemini-3.1-pro') {
      localStorage.removeItem('vp_gemini_model');
    }
  } catch {}

  const CFG = {
    anthropic: {
      label: 'Anthropic (Claude)',
      storageKey: 'vp_anthropic_key',
      storageModel: 'vp_anthropic_model',
      defaultModel: 'claude-haiku-4-5-20251001',
      call: callAnthropic,
    },
    openai: {
      label: 'OpenAI',
      storageKey: 'vp_openai_key',
      storageModel: 'vp_openai_model',
      defaultModel: 'gpt-5.4-mini',
      call: callOpenAI,
    },
    gemini: {
      label: 'Google Gemini',
      storageKey: 'vp_gemini_key',
      storageModel: 'vp_gemini_model',
      defaultModel: 'gemini-2.5-flash',
      call: callGemini,
    },
    openrouter: {
      label: 'OpenRouter',
      storageKey: 'vp_openrouter_key',
      storageModel: 'vp_openrouter_model',
      defaultModel: 'anthropic/claude-haiku-4.5',
      call: callOpenRouter,
    },
  };

  // Translate our generic message content (string OR array of
  // {type:'text',text} / {type:'image',mediaType,data} blocks) into each
  // provider's vision format.
  function toAnthropicContent(content) {
    if (typeof content === 'string') return content;
    return content.map(b => {
      if (b.type === 'image') {
        return { type: 'image', source: { type: 'base64', media_type: b.mediaType, data: b.data } };
      }
      return { type: 'text', text: b.text };
    });
  }
  function toOpenAIContent(content) {
    if (typeof content === 'string') return content;
    return content.map(b => {
      if (b.type === 'image') {
        return { type: 'image_url', image_url: { url: `data:${b.mediaType};base64,${b.data}` } };
      }
      return { type: 'text', text: b.text };
    });
  }
  function toGeminiParts(content) {
    if (typeof content === 'string') return [{ text: content }];
    return content.map(b => b.type === 'image'
      ? { inlineData: { mimeType: b.mediaType, data: b.data } }
      : { text: b.text }
    );
  }

  async function callAnthropic({ system, messages, model, apiKey }) {
    const anthMsgs = messages.map(m => ({ role: m.role, content: toAnthropicContent(m.content) }));
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model, max_tokens: 8192, system, messages: anthMsgs }),
    });
    if (!resp.ok) throw await apiError(resp, 'Anthropic');
    const data = await resp.json();
    return (data.content || []).map(c => c.text || '').join('');
  }

  async function callOpenAI({ system, messages, model, apiKey }) {
    const openaiMessages = [
      { role: 'system', content: system },
      ...messages.map(m => ({ role: m.role, content: toOpenAIContent(m.content) })),
    ];
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages: openaiMessages }),
    });
    if (!resp.ok) throw await apiError(resp, 'OpenAI');
    const data = await resp.json();
    return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
  }

  async function callOpenRouter({ system, messages, model, apiKey }) {
    // OpenRouter is OpenAI-compatible on the chat-completions endpoint.
    const openaiMessages = [
      { role: 'system', content: system },
      ...messages.map(m => ({ role: m.role, content: toOpenAIContent(m.content) })),
    ];
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${apiKey}`,
        'http-referer': window.location.origin || 'https://vibeprompt.app',
        'x-title': 'VibePrompt',
      },
      body: JSON.stringify({ model, messages: openaiMessages }),
    });
    if (!resp.ok) throw await apiError(resp, 'OpenRouter');
    const data = await resp.json();
    return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
  }

  async function callGemini({ system, messages, model, apiKey }) {
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: toGeminiParts(m.content),
    }));
    const body = {
      contents,
      systemInstruction: { parts: [{ text: system }] },
    };
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!resp.ok) throw await apiError(resp, 'Gemini');
    const data = await resp.json();
    const parts = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts;
    return (parts || []).map(p => p.text || '').join('');
  }

  async function apiError(resp, provider) {
    let detail = '';
    try {
      const j = await resp.json();
      detail = (j && j.error && (j.error.message || j.error)) || JSON.stringify(j).slice(0, 240);
      if (typeof detail === 'object') detail = JSON.stringify(detail).slice(0, 240);
    } catch {
      detail = (await resp.text().catch(() => '')).slice(0, 240);
    }
    if (resp.status === 401 || resp.status === 403) {
      return new Error(`Invalid ${provider} API key — double-check it in Tweaks.`);
    }
    if (resp.status === 429) {
      const tip = provider === 'Gemini'
        ? 'Gemini free tier has a low per-minute quota — wait ~30s, or switch to Claude/OpenAI in Tweaks.'
        : 'Wait a moment and retry.';
      return new Error(`Rate limited by ${provider}. ${tip}`);
    }
    if (resp.status === 404) {
      return new Error(`${provider} doesn't recognize the selected model. Pick a different one in Tweaks.`);
    }
    return new Error(`${provider} API ${resp.status}: ${detail}`);
  }

  // Pick a sensible default from a fetched list — prefer fast, widely-available models.
  function pickDefaultFromList(providerId, list) {
    if (!list || !list.length) return null;
    const ids = list.map(m => m.id);
    const prefer = ({
      anthropic: [/haiku-4/i, /sonnet-4/i, /haiku/i, /sonnet/i],
      openai: [/^gpt-5.*mini/i, /^gpt-4o-mini/i, /^gpt-4o/i, /^gpt-/i],
      gemini: [/2\.5-flash$/i, /2\.5-flash/i, /flash/i, /pro/i],
      openrouter: [/anthropic\/claude-haiku/i, /anthropic\/claude-sonnet/i, /openai\/gpt-.*mini/i, /google\/gemini/i],
    })[providerId] || [];
    for (const rx of prefer) {
      const hit = ids.find(id => rx.test(id));
      if (hit) return hit;
    }
    return ids[0];
  }

  window.claude = window.claude || {};
  window.claude.complete = async function ({ system, messages }) {
    const provider = (localStorage.getItem(KEY_PROVIDER) || 'anthropic').toLowerCase();
    const cfg = CFG[provider] || CFG.anthropic;
    const apiKey = (localStorage.getItem(cfg.storageKey) || '').trim();
    if (!apiKey) {
      throw new Error(`Add your ${cfg.label} API key in Tweaks (top-right) to enable chat.`);
    }
    const model = (localStorage.getItem(cfg.storageModel) || '').trim() || cfg.defaultModel;
    try {
      return await cfg.call({ system, messages, model, apiKey });
    } catch (e) {
      if (e && e.name === 'TypeError') {
        throw new Error(`Network error reaching ${cfg.label}. Check your connection.`);
      }
      // Self-heal when the saved model is invalid: fetch the real list, swap, retry once.
      if (e && /recognize the selected model/i.test(e.message || '')) {
        try {
          const list = await window.claude.listModels(provider, apiKey);
          const picked = pickDefaultFromList(provider, list);
          if (picked && picked !== model) {
            localStorage.setItem(cfg.storageModel, picked);
            localStorage.setItem('vp_models_' + provider, JSON.stringify(list));
            return await cfg.call({ system, messages, model: picked, apiKey });
          }
        } catch (_) { /* fall through to original error */ }
      }
      throw e;
    }
  };

  // List available models for a provider. Returns an array of
  // { id, label } or throws a human-readable Error.
  window.claude.listModels = async function (providerId, apiKey) {
    providerId = (providerId || '').toLowerCase();
    apiKey = (apiKey || '').trim();
    if (!apiKey) throw new Error('Save an API key first.');

    if (providerId === 'anthropic') {
      const resp = await fetch('https://api.anthropic.com/v1/models', {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
      });
      if (!resp.ok) throw await apiError(resp, 'Anthropic');
      const data = await resp.json();
      return (data.data || []).map(m => ({ id: m.id, label: m.display_name || m.id }));
    }

    if (providerId === 'openai') {
      const resp = await fetch('https://api.openai.com/v1/models', {
        headers: { 'authorization': `Bearer ${apiKey}` },
      });
      if (!resp.ok) throw await apiError(resp, 'OpenAI');
      const data = await resp.json();
      const chatty = (data.data || [])
        .map(m => m.id)
        .filter(id => /^(gpt-|o\d|chatgpt-)/i.test(id))
        .filter(id => !/embedding|whisper|tts|audio|image|dall-e|moderation|realtime|transcribe/i.test(id))
        .sort();
      return chatty.map(id => ({ id, label: id }));
    }

    if (providerId === 'openrouter') {
      const resp = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { 'authorization': `Bearer ${apiKey}` },
      });
      if (!resp.ok) throw await apiError(resp, 'OpenRouter');
      const data = await resp.json();
      return (data.data || []).map(m => ({ id: m.id, label: m.name || m.id }));
    }

    if (providerId === 'gemini') {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
      if (!resp.ok) throw await apiError(resp, 'Gemini');
      const data = await resp.json();
      return (data.models || [])
        .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
        .map(m => {
          const id = (m.name || '').replace(/^models\//, '');
          return { id, label: m.displayName || id };
        })
        .filter(m => m.id);
    }

    throw new Error(`Unknown provider: ${providerId}`);
  };
})();

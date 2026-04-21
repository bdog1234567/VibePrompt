// claude.jsx — Browser fallback for window.claude.complete.
// On claude.ai/design the sandbox injects window.claude.complete for us.
// On a public deploy we route to whichever provider the user picked in
// Tweaks: Anthropic, OpenAI, or Google Gemini. Keys + model choices are
// stored in localStorage, per provider.

(function () {
  if (window.claude && typeof window.claude.complete === 'function') return;

  const KEY_PROVIDER = 'vp_provider';

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
      defaultModel: 'gpt-5-mini',
      call: callOpenAI,
    },
    gemini: {
      label: 'Google Gemini',
      storageKey: 'vp_gemini_key',
      storageModel: 'vp_gemini_model',
      defaultModel: 'gemini-2.5-flash',
      call: callGemini,
    },
  };

  async function callAnthropic({ system, messages, model, apiKey }) {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model, max_tokens: 1024, system, messages }),
    });
    if (!resp.ok) throw await apiError(resp, 'Anthropic');
    const data = await resp.json();
    return (data.content || []).map(c => c.text || '').join('');
  }

  async function callOpenAI({ system, messages, model, apiKey }) {
    const openaiMessages = [
      { role: 'system', content: system },
      ...messages,
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

  async function callGemini({ system, messages, model, apiKey }) {
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
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
      return new Error(`Rate limited by ${provider}. Wait a moment and retry.`);
    }
    return new Error(`${provider} API ${resp.status}: ${detail}`);
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
      throw e;
    }
  };
})();

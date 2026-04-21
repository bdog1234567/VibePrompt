// claude.jsx — Browser fallback for window.claude.complete.
// On claude.ai/design the sandbox injects window.claude.complete for us.
// On a public deploy it doesn't exist, so we call the Anthropic API directly
// using a user-supplied API key stored in localStorage.

(function () {
  if (window.claude && typeof window.claude.complete === 'function') return;

  const API_URL = 'https://api.anthropic.com/v1/messages';
  const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';
  const KEY_STORAGE = 'vp_anthropic_key';
  const MODEL_STORAGE = 'vp_anthropic_model';

  window.claude = window.claude || {};
  window.claude.complete = async function ({ system, messages }) {
    const apiKey = (localStorage.getItem(KEY_STORAGE) || '').trim();
    if (!apiKey) {
      throw new Error('Add your Anthropic API key in Tweaks (top-right, Sliders icon) to enable chat.');
    }
    const model = (localStorage.getItem(MODEL_STORAGE) || '').trim() || DEFAULT_MODEL;

    let resp;
    try {
      resp = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          system,
          messages,
        }),
      });
    } catch (e) {
      throw new Error('Network error reaching api.anthropic.com. Check your connection.');
    }

    if (!resp.ok) {
      let detail = '';
      try {
        const j = await resp.json();
        detail = j?.error?.message || JSON.stringify(j).slice(0, 240);
      } catch {
        detail = (await resp.text().catch(() => '')).slice(0, 240);
      }
      if (resp.status === 401) throw new Error('Invalid API key — double-check it in Tweaks.');
      if (resp.status === 429) throw new Error('Rate limited by Anthropic. Wait a moment and retry.');
      throw new Error(`Anthropic API ${resp.status}: ${detail}`);
    }

    const data = await resp.json();
    return (data.content || []).map(c => c.text || '').join('');
  };
})();

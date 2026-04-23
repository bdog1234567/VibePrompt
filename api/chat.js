const {
  assertAccess,
  apiError,
  buildProviderRequest,
  extractText,
  providerApiKey,
  providerConfig,
  sendJson,
} = require('./_provider');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed.' });
  }

  try {
    assertAccess(req);
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const provider = (body.provider || 'anthropic').toLowerCase();
    const cfg = providerConfig(provider);
    const apiKey = providerApiKey(provider);

    if (!apiKey) {
      return sendJson(res, 500, {
        error: `Missing ${cfg.envKey}. Add it in your Vercel environment variables.`,
      });
    }
    if (!body.system || !Array.isArray(body.messages)) {
      return sendJson(res, 400, { error: 'Expected system and messages.' });
    }

    const request = buildProviderRequest({
      provider,
      apiKey,
      model: body.model || cfg.defaultModel,
      system: body.system,
      messages: body.messages,
      origin: req.headers.origin,
    });
    const providerResp = await fetch(request.url, request.init);
    if (!providerResp.ok) await apiError(providerResp, cfg.label);

    const data = await providerResp.json();
    return sendJson(res, 200, { text: extractText(provider, data) });
  } catch (err) {
    const status = err.statusCode || 500;
    return sendJson(res, status, { error: err.message || 'Chat request failed.' });
  }
};

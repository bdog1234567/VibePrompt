const assert = require('node:assert/strict');

const {
  assertAccess,
  buildProviderRequest,
  providerApiKey,
} = require('../api/_provider');

function sampleMessages() {
  return [
    { role: 'user', content: 'make it cinematic' },
    {
      role: 'user',
      content: [
        { type: 'text', text: '[Reference]' },
        { type: 'image', mediaType: 'image/jpeg', data: 'abc123' },
      ],
    },
  ];
}

function parseBody(request) {
  return JSON.parse(request.init.body);
}

function headers(request) {
  return request.init.headers;
}

assert.equal(providerApiKey('anthropic', { ANTHROPIC_API_KEY: 'ant' }), 'ant');
assert.equal(providerApiKey('openai', { OPENAI_API_KEY: 'openai' }), 'openai');
assert.equal(providerApiKey('gemini', { GEMINI_API_KEY: 'gem' }), 'gem');
assert.equal(providerApiKey('openrouter', { OPENROUTER_API_KEY: 'or' }), 'or');
assert.equal(providerApiKey('unknown', {}), '');

assert.doesNotThrow(() => assertAccess({ headers: {} }, {}));
assert.doesNotThrow(() => assertAccess(
  { headers: { 'x-vibeprompt-token': 'secret' } },
  { VIBEPROMPT_ACCESS_TOKEN: 'secret' },
));
assert.throws(
  () => assertAccess({ headers: { 'x-vibeprompt-token': 'wrong' } }, { VIBEPROMPT_ACCESS_TOKEN: 'secret' }),
  /Invalid access token/,
);

{
  const request = buildProviderRequest({
    provider: 'anthropic',
    apiKey: 'ant',
    model: 'claude-haiku',
    system: 'system',
    messages: sampleMessages(),
  });
  const body = parseBody(request);
  assert.equal(request.url, 'https://api.anthropic.com/v1/messages');
  assert.equal(headers(request)['x-api-key'], 'ant');
  assert.equal(headers(request)['anthropic-dangerous-direct-browser-access'], undefined);
  assert.equal(body.max_tokens, 8192);
  assert.equal(body.messages[1].content[1].source.media_type, 'image/jpeg');
}

{
  const request = buildProviderRequest({
    provider: 'openai',
    apiKey: 'openai',
    model: 'gpt-5-mini',
    system: 'system',
    messages: sampleMessages(),
  });
  const body = parseBody(request);
  assert.equal(request.url, 'https://api.openai.com/v1/chat/completions');
  assert.equal(headers(request).authorization, 'Bearer openai');
  assert.equal(Object.hasOwn(body, 'max_tokens'), false);
  assert.equal(body.messages[0].role, 'system');
  assert.match(body.messages[2].content[1].image_url.url, /^data:image\/jpeg;base64,/);
}

{
  const request = buildProviderRequest({
    provider: 'openrouter',
    apiKey: 'or',
    model: 'anthropic/claude-haiku-4.5',
    system: 'system',
    messages: sampleMessages(),
    origin: 'https://vibeprompt.example',
  });
  const body = parseBody(request);
  assert.equal(request.url, 'https://openrouter.ai/api/v1/chat/completions');
  assert.equal(headers(request)['http-referer'], 'https://vibeprompt.example');
  assert.equal(Object.hasOwn(body, 'max_tokens'), false);
}

{
  const request = buildProviderRequest({
    provider: 'gemini',
    apiKey: 'gem',
    model: 'gemini-2.5-flash',
    system: 'system',
    messages: sampleMessages(),
  });
  const body = parseBody(request);
  assert.match(request.url, /generativelanguage\.googleapis\.com/);
  assert.equal(Object.hasOwn(body, 'generationConfig'), false);
  assert.equal(body.contents[1].parts[1].inlineData.mimeType, 'image/jpeg');
}

assert.throws(
  () => buildProviderRequest({ provider: 'missing', apiKey: 'x', model: 'm', system: '', messages: [] }),
  /Unknown provider/,
);

console.log('provider proxy tests passed');

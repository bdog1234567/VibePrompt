# VibePrompt

Browser-based prompt studio for image and video generators.

## Local/static use

Open `index.html` directly or serve the folder with any static server. In static mode, chat can use browser fallback keys saved from Tweaks.

## Hosted phone-friendly use

Deploy the repo to Vercel. The frontend calls `/api/chat`, and provider keys stay in Vercel environment variables instead of the browser.

Set any provider keys you want to use:

```text
ANTHROPIC_API_KEY
OPENAI_API_KEY
GEMINI_API_KEY
OPENROUTER_API_KEY
```

Optional private access gate:

```text
VIBEPROMPT_ACCESS_TOKEN
```

If `VIBEPROMPT_ACCESS_TOKEN` is set, enter the same value in Tweaks -> App access token on each device.

## Test

```bash
npm test
```

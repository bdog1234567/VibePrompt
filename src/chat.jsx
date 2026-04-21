// chat.jsx — AI creative director chat panel
const { useState, useRef, useEffect } = React;

const STARTERS = [
  "I want a cinematic sci-fi scene",
  "Golden hour portrait, film look",
  "Surreal dreamscape, slow motion",
  "Street photography, Tokyo rain",
  "Epic fantasy landscape at dusk",
  "Macro product shot, studio",
];

const SYSTEM_PROMPT = `You are a creative director and prompt engineer specializing in AI image and video generation. Your job is to help users develop rich, specific prompts optimized for their chosen AI model.

When a user describes their creative vision, do the following:
1. A brief enthusiastic reaction (1 sentence)
2. 2-3 sentences expanding on the creative direction
3. A "Suggestions:" block with 4-6 concrete field values, formatted exactly as: Field: Value
4. Then ALWAYS end every response with this block (no exceptions):

---
GENERATED PROMPT: [write a complete, ready-to-use prompt optimized for the specific model noted in the system context. Follow that model's prompt style exactly.]

Keep the generated prompt specific and vivid. Never skip the GENERATED PROMPT block.`;

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  }
  return Promise.resolve(fallbackCopy(text));
}
function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
  document.body.appendChild(ta);
  ta.focus(); ta.select();
  try { document.execCommand('copy'); } catch(e) {}
  document.body.removeChild(ta);
}

function CopyBtn({ text, small }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    copyToClipboard(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
  };
  return (
    <button onClick={copy} style={{
      appearance: 'none', border: '1px solid var(--line-2)',
      background: copied ? 'oklch(0.72 0.14 155 / 0.15)' : 'var(--bg-3)',
      color: copied ? 'oklch(0.72 0.14 155)' : 'var(--fg-2)',
      borderColor: copied ? 'oklch(0.72 0.14 155 / 0.4)' : 'var(--line-2)',
      borderRadius: 5, padding: small ? '3px 8px' : '5px 10px',
      fontSize: 11, fontFamily: 'var(--font-ui)', cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 4,
      transition: 'all .15s',
    }}>
      {copied ? '✓ Copied' : <><Icons.Copy /> Copy</>}
    </button>
  );
}

function parseSuggestions(text) {
  const sugs = [];
  const lines = text.split('\n');
  lines.forEach(line => {
    const m = line.match(/^[-•*]?\s*([A-Za-z\s\/]+):\s*(.+)$/);
    if (m && m[2].trim().length > 0 && m[2].trim().length < 100 && !m[1].includes('GENERATED') && !m[1].includes('http')) {
      sugs.push({ label: m[1].trim(), value: m[2].trim() });
    }
  });
  return sugs.slice(0, 6);
}

function parseGeneratedPrompt(text) {
  const match = text.match(/---\s*\n?GENERATED PROMPT:\s*(.+?)(?:\n\n|$)/s);
  if (match) return match[1].trim();
  // fallback: look for it anywhere
  const fallback = text.match(/GENERATED PROMPT:\s*(.+?)(?:\n\n|$)/s);
  return fallback ? fallback[1].trim() : null;
}

function cleanText(text) {
  return text.replace(/---\s*\n?GENERATED PROMPT:.*$/s, '').trim();
}

function mapSuggestionToField(label, value) {
  const l = label.toLowerCase();
  if (l.includes('subject')) return { field: 'subject', value };
  if (l.includes('action') || l.includes('motion')) return { field: 'action', value };
  if (l.includes('setting') || l.includes('location') || l.includes('environment')) return { field: 'setting', value };
  if (l.includes('time') || l.includes('lighting')) return { field: 'time', value };
  if (l.includes('weather') || l.includes('atmosphere')) return { field: 'weather', value };
  if (l.includes('mood') || l.includes('emotion')) return { field: 'mood', value };
  if (l.includes('style') || l.includes('aesthetic') || l.includes('color') || l.includes('palette') || l.includes('tone')) return { field: 'styles', value: [value] };
  if (l.includes('artist') || l.includes('cinematographer') || l.includes('director') || l.includes('photographer')) return { field: 'artists', value: [value] };
  if (l.includes('camera') && (l.includes('move') || l.includes('movement') || l.includes('motion'))) return { field: 'cameraMove', value };
  if (l.includes('lens')) return { field: 'lens', value };
  if (l.includes('film')) return { field: 'film', value };
  if (l.includes('composition') || l.includes('framing')) return { field: 'composition', value };
  if (l.includes('audio') || l.includes('sound')) return { field: 'audio', value };
  if (l.includes('pacing') || l.includes('pace')) return { field: 'pacing', value };
  if (l.includes('quality')) return { field: 'quality', value: [value] };
  return null;
}

function PromptCard({ prompt, onSendToGenerator }) {
  return (
    <div style={{
      marginTop: 12,
      background: 'linear-gradient(135deg, oklch(0.18 0.04 45), oklch(0.14 0.02 45))',
      border: '1px solid var(--accent-line)',
      borderRadius: 10, overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', borderBottom: '1px solid var(--accent-line)',
        fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em',
        color: 'var(--accent)', fontWeight: 600,
      }}>
        <span>✦</span> Generated Prompt
        <span style={{ flex: 1 }} />
        <CopyBtn text={prompt} small />
      </div>
      <div style={{
        padding: '10px 12px',
        fontSize: 12.5, lineHeight: 1.65,
        color: 'var(--fg-0)', fontStyle: 'italic',
      }}>
        {prompt}
      </div>
      <div style={{ padding: '8px 12px', borderTop: '1px solid var(--accent-line)' }}>
        <button
          onClick={onSendToGenerator}
          style={{
            width: '100%', appearance: 'none',
            background: 'var(--accent)', color: 'var(--accent-ink)',
            border: 'none', borderRadius: 7, padding: '8px 14px',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'var(--font-ui)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'filter .12s',
          }}
          onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.1)'}
          onMouseOut={e => e.currentTarget.style.filter = 'none'}
        >
          Send to Prompt Generator →
        </button>
      </div>
    </div>
  );
}

function ChatPane({ fields, onApply, onApplyAll, mode, modelId }) {
  const [messages, setMessages] = useState([{
    id: 0, role: 'bot',
    text: `Hey! I'm your creative director. Describe the scene, vibe, or feeling you're going for — I'll help you craft the perfect ${mode === 'video' ? 'video' : 'image'} prompt. After each message I'll generate a ready-to-use prompt you can send straight to the generator.`,
    suggestions: [], applied: [], generatedPrompt: null,
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { id: Date.now(), role: 'user', text: text.trim(), suggestions: [], applied: [], generatedPrompt: null };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    const allModels = mode === 'image' ? window.IMAGE_MODELS : window.VIDEO_MODELS;
    const modelDef = allModels.find(m => m.id === modelId) || allModels[0];
    const modelNote = `\nTarget model: ${modelDef.name} (${modelDef.short})\nPrompt style for this model: ${modelDef.promptStyle}\nModel-specific tips: ${modelDef.tips}`;

    const fieldCtx = Object.entries(fields)
      .filter(([k, v]) => v && (typeof v === 'string' ? v.trim() : Array.isArray(v) ? v.length > 0 : true))
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
      .join('\n');

    const contextNote = fieldCtx ? `\nCurrent prompt fields already filled:\n${fieldCtx}` : '';
    const modeNote = `\nMode: ${mode === 'video' ? 'Video generation' : 'Image generation'}`;

    const historyMsgs = updatedMessages.map(m => ({
      role: m.role === 'bot' ? 'assistant' : 'user',
      content: m.text,
    }));

    try {
      const reply = await window.claude.complete({
        system: SYSTEM_PROMPT + modeNote + modelNote + contextNote,
        messages: historyMsgs,
      });

      const generatedPrompt = parseGeneratedPrompt(reply);
      const displayText = cleanText(reply);
      const sugs = parseSuggestions(displayText);

      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'bot',
        text: displayText,
        suggestions: sugs, applied: [],
        generatedPrompt,
      }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'bot',
        text: 'Something went wrong — please try again.',
        suggestions: [], applied: [], generatedPrompt: null,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const applySuggestion = (msgId, sug, idx) => {
    const mapped = mapSuggestionToField(sug.label, sug.value);
    if (mapped) onApply(mapped);
    setMessages(prev => prev.map(m =>
      m.id !== msgId ? m : { ...m, applied: [...new Set([...(m.applied || []), idx])] }
    ));
  };

  const sendToGenerator = (prompt, msg) => {
    // Apply all suggestions from this message
    (msg.suggestions || []).forEach(sug => {
      const mapped = mapSuggestionToField(sug.label, sug.value);
      if (mapped) onApply(mapped);
    });
    // Also set the subject to the generated prompt if subject is empty
    if (prompt && !fields.subject) {
      onApply({ field: 'subject', value: prompt });
    }
    if (onApplyAll) onApplyAll(prompt);
  };

  return (
    <div className="chat">
      <div className="chat-messages" ref={scrollRef}>
        {messages.map(msg => (
          <div key={msg.id} className={`msg ${msg.role}`}>
            <div className="av">{msg.role === 'bot' ? 'VP' : 'U'}</div>
            <div className="msg-body">
              <div className="msg-name">{msg.role === 'bot' ? 'VibePrompt AI' : 'You'}</div>
              <div className="msg-text">
                {msg.text.split('\n').map((line, i) => line.trim() ? <p key={i}>{line}</p> : null)}
              </div>

              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="suggestions" style={{ marginTop: 10 }}>
                  {msg.suggestions.map((sug, i) => (
                    <button
                      key={i}
                      className={`sug-chip ${(msg.applied || []).includes(i) ? 'applied' : ''}`}
                      onClick={() => applySuggestion(msg.id, sug, i)}
                    >
                      {(msg.applied || []).includes(i) ? '✓ ' : '+ '}
                      <strong>{sug.label}:</strong>&nbsp;{sug.value.length > 26 ? sug.value.slice(0, 26) + '…' : sug.value}
                    </button>
                  ))}
                </div>
              )}

              {msg.generatedPrompt && (
                <PromptCard
                  prompt={msg.generatedPrompt}
                  onSendToGenerator={() => sendToGenerator(msg.generatedPrompt, msg)}
                />
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="msg bot">
            <div className="av">VP</div>
            <div className="msg-body">
              <div className="msg-name">VibePrompt AI</div>
              <div className="typing"><span /><span /><span /></div>
            </div>
          </div>
        )}
      </div>

      <div className="chat-foot">
        {messages.length <= 1 && (
          <div className="chat-starters">
            <div className="lbl">Quick starts</div>
            {STARTERS.map(s => (
              <button key={s} className="starter-btn" onClick={() => sendMessage(s)}>{s}</button>
            ))}
          </div>
        )}
        <div className="chat-compose">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={loading ? 'Generating…' : 'Describe or refine your creative vision…'}
            rows={2}
            disabled={loading}
            style={{ opacity: loading ? 0.6 : 1 }}
          />
          <div className="compose-row">
            <span className="hint">Enter to send · Shift+Enter for newline</span>
            <button className="iconbtn primary" onClick={() => sendMessage(input)} disabled={!input.trim() || loading}>
              <Icons.Send /> {loading ? 'Generating…' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ChatPane });

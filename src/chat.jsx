// chat.jsx — AI creative director chat panel
const { useState, useRef, useEffect } = React;

// Downscale + re-encode a user-picked image so we don't blow token budgets.
// Returns { mediaType, data (base64, no prefix), dataUrl (for preview) }.
async function processImageFile(file, maxEdge = 1024) {
  const dataUrl = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onerror = () => rej(new Error('Could not read image.'));
    r.onload = () => res(r.result);
    r.readAsDataURL(file);
  });
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onerror = () => rej(new Error('Could not decode image.'));
    i.onload = () => res(i);
    i.src = dataUrl;
  });
  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d').drawImage(img, 0, 0, w, h);
  const outUrl = canvas.toDataURL('image/jpeg', 0.88);
  const match = outUrl.match(/^data:(image\/[^;]+);base64,(.*)$/);
  if (!match) throw new Error('Could not encode image.');
  return { mediaType: match[1], data: match[2], dataUrl: outUrl };
}

const STARTERS = [
  "I want a cinematic sci-fi scene",
  "Golden hour portrait, film look",
  "Surreal dreamscape, slow motion",
  "Street photography, Tokyo rain",
  "Epic fantasy landscape at dusk",
  "Macro product shot, studio",
];

const SYSTEM_PROMPT = `You are a creative director and prompt engineer for AI image/video generation. Be concise — rambling is a failure mode, especially on free-tier LLMs.

CRITICAL OUTPUT DISCIPLINE:
- Your response MUST start with the literal line beginning with "Reaction:". NO text before it.
- DO NOT output drafts, rewrites, brainstorm lists, idea enumerations ("Idea 1/2/3"), word-count checks, constraint checks, or any reasoning, planning, or "wait let me reconsider" passages. No scratch work. Produce the final answer on the first try.
- DO NOT number words or list them. DO NOT repeat the prompt twice.
- No section headings other than the five below. No preamble. No closing remarks.

Respond in EXACTLY this structure:
1. Reaction: ONE short sentence (≤12 words).
2. Direction: ONE OR TWO short sentences expanding the creative angle.
3. "Suggestions:" block — 3-5 lines, each formatted exactly "Field: Value". Values ≤8 words each.
4. A literal line containing only: ---
5. GENERATED PROMPT: <the prompt, on one line>

The GENERATED PROMPT MUST:
- Fit the word budget given in the model brief below. Silently keep within it — do not show counts.
- Follow the model's prompt style exactly.
- Include ONLY elements the user asked for or that the model brief calls out.
- Never pad with lists of camera bodies, lenses, film stocks, or quality-booster adjectives the user did not request.

Never skip the GENERATED PROMPT block.`;

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
  // Use the LAST occurrence — some models produce drafts then a final.
  const matches = [...text.matchAll(/GENERATED PROMPT:\s*([\s\S]+?)(?:\n\s*\n|$)/gi)];
  if (!matches.length) return null;
  return matches[matches.length - 1][1].trim();
}

function cleanText(text) {
  // 1. Strip everything from "GENERATED PROMPT:" to end.
  let out = text.replace(/(?:\n---\s*\n)?GENERATED PROMPT:[\s\S]*$/i, '').trim();
  // 2. If there are multiple "Reaction:" lines (model leaked drafts), keep
  //    only from the LAST one forward — that's the final answer.
  const reactionMatches = [...out.matchAll(/^[ \t]*Reaction\s*:/gmi)];
  if (reactionMatches.length > 1) {
    const last = reactionMatches[reactionMatches.length - 1];
    out = out.slice(last.index).trim();
  } else if (reactionMatches.length === 1 && reactionMatches[0].index > 0) {
    // One Reaction but preceded by scratch — trim anything before it.
    out = out.slice(reactionMatches[0].index).trim();
  }
  // 3. Remove obvious scratchpad patterns that sometimes slip through.
  out = out
    .replace(/^\s*\*?\s*(Draft|Revised Prompt|Word count check|Checking constraints|Selection|Prompt Construction|Idea \d+)[: ].*$/gmi, '')
    .replace(/^\s*\d+\.\s+\S+\s*$/gm, '') // single-word numbered lines (word counting)
    .replace(/^\s*Total:\s*\d+\s*words?.*$/gmi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return out;
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

function ImageSlot({ label, img, onPick, onClear }) {
  const inputRef = useRef(null);
  const onChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) onPick(f);
    e.target.value = '';
  };
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 3,
      border: '1px dashed var(--line-2)', borderRadius: 7,
      padding: 5, background: 'var(--bg-2)', minWidth: 84,
    }}>
      {img ? (
        <div style={{ position: 'relative' }}>
          <img src={img.dataUrl} alt={label} style={{
            width: 74, height: 74, objectFit: 'cover', borderRadius: 4, display: 'block',
          }} />
          <button
            onClick={onClear}
            title="Remove"
            style={{
              position: 'absolute', top: -6, right: -6,
              width: 18, height: 18, borderRadius: '50%',
              border: '1px solid var(--line-2)', background: 'var(--bg-3)',
              color: 'var(--fg-1)', fontSize: 11, lineHeight: '16px',
              cursor: 'pointer', padding: 0,
            }}
          >×</button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current && inputRef.current.click()}
          style={{
            width: 74, height: 74, borderRadius: 4,
            border: '1px solid var(--line-2)', background: 'var(--bg-3)',
            color: 'var(--fg-2)', cursor: 'pointer', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title={`Attach ${label.toLowerCase()}`}
        >+</button>
      )}
      <span style={{ fontSize: 9.5, color: 'var(--fg-3)', textAlign: 'center' }}>{label}</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={onChange}
      />
    </div>
  );
}

function ChatPane({ fields, onApply, onApplyAll, mode, modelId, generalSubMode = 'photo' }) {
  // When General mode, treat as photo or video for ref/route logic
  const effectiveMode = mode === 'general' ? (generalSubMode === 'video' ? 'video' : 'image') : mode;
  const [messages, setMessages] = useState([{
    id: 0, role: 'bot',
    text: `Hey! I'm your creative director. Describe the scene, vibe, or feeling you're going for — I'll help you craft the perfect prompt. After each message I'll generate a ready-to-use prompt you can send straight to the generator.`,
    suggestions: [], applied: [], generatedPrompt: null,
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  // Video ref mode: 'text' | 'single' | 'firstlast'
  const [refMode, setRefMode] = useState('text');
  // Image/General-photo route: 'generate' | 'aesthetic' | 'edit' | 'iterate-camera'
  const [imageRoute, setImageRoute] = useState('generate');
  const [refs, setRefs] = useState({ single: null, first: null, last: null, aesthetics: [] });
  const [refErr, setRefErr] = useState('');
  const scrollRef = useRef(null);

  // Derive which ref slot mode to use
  const effectiveRefMode = (() => {
    if (effectiveMode === 'video') return refMode;
    // image / general-photo
    if (imageRoute === 'generate') return 'text';
    if (imageRoute === 'aesthetic') return 'aesthetic';
    return 'single'; // edit + iterate both use one slot
  })();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  // Clear mismatched refs when mode/refMode changes.
  useEffect(() => {
    setRefs(prev => {
      if (effectiveRefMode === 'aesthetic') return { single: null, first: null, last: null, aesthetics: prev.aesthetics || [] };
      if (effectiveRefMode === 'text') return { single: null, first: null, last: null, aesthetics: [] };
      if (effectiveRefMode === 'single') return { single: prev.single, first: null, last: null, aesthetics: [] };
      return { single: null, first: prev.first, last: prev.last, aesthetics: [] };
    });
  }, [effectiveRefMode]);

  const pickImage = async (slot, file) => {
    if (!file) return;
    setRefErr('');
    try {
      const img = await processImageFile(file);
      setRefs(prev => ({ ...prev, [slot]: img }));
    } catch (e) {
      setRefErr(e?.message || 'Could not attach that image.');
    }
  };
  const clearRef = (slot) => setRefs(prev => ({ ...prev, [slot]: null }));

  const addAesthetic = async (file) => {
    if (!file || (refs.aesthetics || []).length >= 4) return;
    setRefErr('');
    try {
      const img = await processImageFile(file);
      setRefs(prev => ({ ...prev, aesthetics: [...(prev.aesthetics || []), img] }));
    } catch (e) {
      setRefErr(e?.message || 'Could not attach that image.');
    }
  };
  const replaceAesthetic = async (idx, file) => {
    if (!file) return;
    setRefErr('');
    try {
      const img = await processImageFile(file);
      setRefs(prev => {
        const next = [...(prev.aesthetics || [])];
        next[idx] = img;
        return { ...prev, aesthetics: next };
      });
    } catch (e) {
      setRefErr(e?.message || 'Could not attach that image.');
    }
  };
  const clearAesthetic = (idx) => setRefs(prev => ({
    ...prev,
    aesthetics: (prev.aesthetics || []).filter((_, i) => i !== idx),
  }));

  const attachedImages = (() => {
    if (effectiveRefMode === 'aesthetic') {
      return (refs.aesthetics || []).map((img, i) => ({
        label: `Style ref ${i + 1}`, slot: `aesthetic_${i}`, ...img,
      }));
    }
    if (effectiveRefMode === 'single' && refs.single) {
      return [{ label: 'Reference image', slot: 'single', ...refs.single }];
    }
    if (effectiveRefMode === 'firstlast') {
      const out = [];
      if (refs.first) out.push({ label: 'First frame', slot: 'first', ...refs.first });
      if (refs.last) out.push({ label: 'Last frame', slot: 'last', ...refs.last });
      return out;
    }
    return [];
  })();

  const sendMessage = async (text) => {
    if ((!text.trim() && !attachedImages.length) || loading) return;
    const userMsg = {
      id: Date.now(),
      role: 'user',
      text: text.trim(),
      images: attachedImages.map(img => ({ label: img.label, mediaType: img.mediaType, data: img.data, dataUrl: img.dataUrl })),
      suggestions: [], applied: [], generatedPrompt: null,
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    // Clear the staged refs now that they're attached to the message.
    setRefs({ single: null, first: null, last: null, aesthetics: [] });
    setLoading(true);

    const allModels = mode !== 'general'
      ? (effectiveMode === 'video' ? window.VIDEO_MODELS : window.IMAGE_MODELS)
      : [window.GENERAL_MODEL];
    const modelDef = allModels.find(m => m.id === modelId) || allModels[0];
    const [minW, maxW] = modelDef.targetWords || [20, 50];
    const modelNote =
      `\nTarget model: ${modelDef.name}` +
      `\nPrompt style: ${modelDef.promptStyle}` +
      `\nModel brief: ${modelDef.briefForLLM || modelDef.tips}` +
      `\nWord budget for GENERATED PROMPT: ${minW}-${maxW} words. Count them.`;

    const fieldCtx = Object.entries(fields)
      .filter(([k, v]) => v && (typeof v === 'string' ? v.trim() : Array.isArray(v) ? v.length > 0 : true))
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
      .join('\n');

    const contextNote = fieldCtx ? `\nCurrent prompt fields already filled:\n${fieldCtx}` : '';
    const modeNote = `\nMode: ${
      effectiveMode === 'video'
        ? (mode === 'general' ? 'General video (model TBD)' : 'Video generation')
        : (mode === 'general' ? 'General photo (model TBD)' : 'Image generation')
    }`;

    let refNote = '';
    if (effectiveRefMode === 'aesthetic' && attachedImages.length) {
      const count = attachedImages.length;
      refNote = `\nThe user attached ${count} style reference image${count > 1 ? 's' : ''}. Analyze their shared color palette, lighting, mood, texture, and compositional style. Generate a prompt that recreates this exact aesthetic with an ENTIRELY DIFFERENT subject and setting — unless the user's message specifies what to keep or change.`;
    } else if (imageRoute === 'edit' && attachedImages.length) {
      refNote = `\nThe user attached an image they want to EDIT. Generate a prompt that describes specific changes to make to this exact image — adjust colors, swap elements, add or remove objects, change lighting, restyle, recompose, etc. Be precise about what to change vs. what to preserve (face, pose, composition, background as applicable).`;
    } else if (imageRoute === 'iterate-camera' && attachedImages.length) {
      refNote = `\nThe user attached an image and wants a DIFFERENT CAMERA ANGLE of the EXACT SAME scene — same subject, same action, same lighting, same setting, same mood. Only the camera position and framing change. Suggest a specific new angle: low angle looking up, overhead bird's-eye, wide establishing, extreme close-up, over-the-shoulder, Dutch tilt, profile, 3/4, rear, etc. Be precise about shot type, camera height, distance, direction, and lens. Do not invent new subjects or change the scene.`;
    } else if (effectiveMode === 'video' && effectiveRefMode === 'single' && attachedImages.length) {
      refNote = `\nThe user attached a single reference image — this is an image-to-video shot starting from (or inspired by) that image. Describe motion, camera work, and how the scene evolves over time.`;
    } else if (effectiveMode === 'video' && effectiveRefMode === 'firstlast' && attachedImages.length >= 1) {
      refNote = `\nThe user attached first-frame and/or last-frame references for a first-last-frame video. Describe a smooth motion/transition that starts at the first frame and ends at the last frame — camera moves, subject action, lighting changes.`;
    }

    // Flux 2 responds strongly to camera/optics language. When editing or style-matching
    // on a Flux 2 model, push the chatbot to analyze the attached image(s) in those terms
    // and bake concrete camera vocabulary into the generated prompt.
    const isFlux = modelId === 'flux' || modelId === 'flux-max';
    const fluxCameraRoute = isFlux && attachedImages.length && (imageRoute === 'edit' || effectiveRefMode === 'aesthetic');
    if (fluxCameraRoute) {
      refNote += `\nFLUX 2 CAMERA FOCUS: this model rewards concrete photographic vocabulary. First, read the attached image${attachedImages.length > 1 ? 's' : ''} through a photographer's eye and name what you see — likely camera body or format (e.g. medium-format Hasselblad, Leica M11, Sony A7R V, 35mm film SLR), focal length (wide 24-35mm, normal 50mm, portrait 85mm, tele 135mm+), aperture and depth of field (f/1.4 shallow with bokeh vs f/8 deep), focus behavior (subject-sharp with falloff, rack focus, tilt-shift plane), shutter feel (frozen vs motion blur), film stock or sensor look (Portra 400, Cinestill 800T, digital clean), and lighting direction/quality. Then write the generated prompt so these camera terms are explicit in the prose — ${imageRoute === 'edit' ? 'preserve the original optics unless the user asks to change them, and describe edits in the same photographic language' : 'carry the source optics into the new subject so the style match reads as the same camera and lens world'}. Pick AT MOST one of {body, focal length, film stock} to foreground — do not stack all three.`;
    }

    // Build provider-ready history. Messages may carry images on user turns.
    const historyMsgs = updatedMessages.map(m => {
      const role = m.role === 'bot' ? 'assistant' : 'user';
      if (m.role === 'user' && m.images && m.images.length) {
        const blocks = [];
        m.images.forEach(img => {
          blocks.push({ type: 'text', text: `[${img.label}]` });
          blocks.push({ type: 'image', mediaType: img.mediaType, data: img.data });
        });
        if (m.text) blocks.push({ type: 'text', text: m.text });
        else if (!blocks.some(b => b.type === 'text' && b.text.trim())) {
          blocks.push({ type: 'text', text: '(image only — interpret and generate a prompt)' });
        }
        return { role, content: blocks };
      }
      return { role, content: m.text };
    });

    try {
      const reply = await window.claude.complete({
        system: SYSTEM_PROMPT + modeNote + modelNote + contextNote + refNote,
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
        text: e && e.message ? `⚠️ ${e.message}` : 'Something went wrong — please try again.',
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
              {msg.images && msg.images.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                  {msg.images.map((img, i) => (
                    <div key={i} style={{
                      display: 'flex', flexDirection: 'column', gap: 2,
                      border: '1px solid var(--line-2)', borderRadius: 6,
                      padding: 3, background: 'var(--bg-3)',
                    }}>
                      <img src={img.dataUrl} alt={img.label} style={{
                        width: 84, height: 84, objectFit: 'cover', borderRadius: 4, display: 'block',
                      }} />
                      <span style={{ fontSize: 9.5, color: 'var(--fg-3)', textAlign: 'center' }}>{img.label}</span>
                    </div>
                  ))}
                </div>
              )}
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
          {/* Image / General-photo: route selector */}
          {effectiveMode === 'image' && (
            <div className="tw-opts" style={{ flexWrap: 'wrap', marginBottom: 6 }}>
              {[
                ['generate', 'Generate'],
                ['aesthetic', 'Style Match'],
                ['edit', 'Edit Image'],
                ['iterate-camera', 'Iterate Camera'],
              ].map(([id, label]) => (
                <button key={id} className="tw-opt" aria-pressed={imageRoute === id}
                  onClick={() => setImageRoute(id)} style={{ fontSize: 10.5 }}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Video / General-video: ref mode selector */}
          {effectiveMode === 'video' && (
            <div className="tw-opts" style={{ flexWrap: 'wrap', marginBottom: 6 }}>
              {[
                ['text', 'Text'],
                ['single', 'Image → video'],
                ['firstlast', 'First + Last'],
              ].map(([id, label]) => (
                <button key={id} className="tw-opt" aria-pressed={refMode === id}
                  onClick={() => setRefMode(id)} style={{ fontSize: 10.5 }}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Aesthetic refs — image / general mode: up to 4 style reference images */}
          {effectiveRefMode === 'aesthetic' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
              {(refs.aesthetics || []).map((img, i) => (
                <ImageSlot
                  key={i}
                  label={`Style ref ${i + 1}`}
                  img={img}
                  onPick={file => replaceAesthetic(i, file)}
                  onClear={() => clearAesthetic(i)}
                />
              ))}
              {(refs.aesthetics || []).length < 4 && (
                <ImageSlot
                  label={`Style ref ${(refs.aesthetics || []).length + 1}`}
                  img={null}
                  onPick={addAesthetic}
                  onClear={() => {}}
                />
              )}
            </div>
          )}

          {/* Single / first-last refs — video mode or image edit/iterate */}
          {(effectiveRefMode === 'single' || effectiveRefMode === 'firstlast') && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
              {effectiveRefMode === 'single' && (
                <ImageSlot
                  label={
                    imageRoute === 'edit' ? 'Image to edit'
                    : imageRoute === 'iterate-camera' ? 'Original shot'
                    : 'Reference'
                  }
                  img={refs.single}
                  onPick={file => pickImage('single', file)}
                  onClear={() => clearRef('single')}
                />
              )}
              {effectiveRefMode === 'firstlast' && (
                <>
                  <ImageSlot
                    label="First frame"
                    img={refs.first}
                    onPick={file => pickImage('first', file)}
                    onClear={() => clearRef('first')}
                  />
                  <ImageSlot
                    label="Last frame"
                    img={refs.last}
                    onPick={file => pickImage('last', file)}
                    onClear={() => clearRef('last')}
                  />
                </>
              )}
            </div>
          )}
          {refErr && (
            <div style={{ fontSize: 10.5, color: 'oklch(0.72 0.14 25)', marginBottom: 6 }}>{refErr}</div>
          )}

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
            <button
              className="iconbtn primary"
              onClick={() => sendMessage(input)}
              disabled={(!input.trim() && attachedImages.length === 0) || loading}
            >
              <Icons.Send /> {loading ? 'Generating…' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ChatPane });

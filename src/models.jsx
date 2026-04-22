// models.jsx — model definitions + selector component

const IMAGE_MODELS = [
  {
    id: 'midjourney',
    name: 'Midjourney',
    short: 'MJ v7',
    badge: 'MJ',
    color: 'oklch(0.72 0.14 265)',
    promptStyle: 'natural language + --flags, v7 default',
    tips: 'v7 is now the default and rewards fuller sentences over bare tag lists. Use --ar for aspect, --s (stylize 0-1000), --c (chaos), --no for negatives, --sref for style refs, --oref + --ow (1-1000) for omni-reference character consistency, --draft for 10x-faster iteration (disable for final). Omit --v; 7 is implicit.',
    briefForLLM: 'Natural sentence, subject first. Flags (--ar/--s/--c) are appended separately — do not include them in the prose.',
    targetWords: [12, 30],
    paramSuffix: (fields) => {
      const p = [];
      if (fields.aspectRatio) p.push(`--ar ${fields.aspectRatio}`);
      if (fields.stylize) p.push(`--s ${fields.stylize}`);
      if (fields.chaos) p.push(`--c ${fields.chaos}`);
      if (fields.mjStyle) p.push(`--style ${fields.mjStyle}`);
      if (fields.mjVersion && fields.mjVersion !== '7') p.push(`--v ${fields.mjVersion}`);
      if (fields.seed) p.push(`--seed ${fields.seed}`);
      return p.join(' ');
    },
  },
  {
    id: 'flux',
    name: 'Flux 2 Pro',
    short: 'Flux 2 Pro',
    badge: 'F2',
    color: 'oklch(0.72 0.14 180)',
    promptStyle: 'natural prose, 30-80 words, no negatives',
    tips: 'Flux 2 Pro: write natural prose, front-load the subject, be specific about lighting and camera. Camera/lens lingo pulls hard — name the body (Hasselblad, Leica M11, Sony A7R V), focal length (35mm, 85mm), aperture (f/1.4 shallow DoF, f/8 deep), and film stock (Kodak Portra 400, Cinestill 800T). Aim 30-80 words — the T5 encoder handles more but conciseness wins. No negative prompts. Quote exact strings for in-image text (92% accuracy). Hex codes like #FF6B00 are respected. Up to 2-3 reference images via image_urls / input_image_N.',
    briefForLLM: 'Natural prose, subject first. Pick AT MOST one of: camera body, focal length, or film stock — do not stack them. No negatives, no quality-booster adjectives.',
    targetWords: [30, 55],
    paramSuffix: () => '',
  },
  {
    id: 'flux-max',
    name: 'Flux 2 Max',
    short: 'Flux 2 Max',
    badge: 'FX',
    color: 'oklch(0.78 0.14 200)',
    promptStyle: 'prose prompts, up to 10 refs, 4MP output',
    tips: 'Flux 2 Max: same prose style as Pro but with higher fidelity, 4MP max resolution, and up to 10 reference images for character/brand consistency. Camera/lens lingo lands hard here too — specify body, focal length, aperture, film stock for photo looks. Web-grounded generation handles current events and real-world knowledge. Use multiple refs for brand kits, fashion editorials, or multi-character scenes. No negatives. Let refs carry identity; let the prose carry look and lighting.',
    briefForLLM: 'Same prose discipline as Pro. Reference images carry identity; prose carries look and light. One camera/lens hint max — no stacking.',
    targetWords: [30, 60],
    paramSuffix: () => '',
  },
  {
    id: 'dalle3',
    name: 'DALL·E 3',
    short: 'DALL·E 3',
    badge: 'D3',
    color: 'oklch(0.72 0.14 145)',
    promptStyle: 'verbose natural language, no negatives',
    tips: 'DALL·E 3 loves verbose, explicit descriptions — style, medium, lighting, mood, composition in full sentences. The API rewrites short prompts unless you phrase them assertively (e.g. start with "I NEED..."). No negative prompts. Inside ChatGPT the native GPT-Image generator has largely replaced it but the API is unchanged.',
    briefForLLM: 'Descriptive but focused: subject, setting, mood, lighting in plain sentences. No negatives. Do not tack on every stylistic adjective you can think of.',
    targetWords: [40, 70],
    paramSuffix: () => '',
  },
  {
    id: 'ideogram',
    name: 'Ideogram 3',
    short: 'Ideogram 3',
    badge: 'ID',
    color: 'oklch(0.72 0.14 55)',
    promptStyle: 'NL with quoted in-image text',
    tips: 'Ideogram 3 leads on typography: quote exact strings for any in-image text. Specify visual style explicitly ("vector illustration", "poster design", "3D render"). Style references attach as separate uploads, not prompt syntax. Magic Prompt rewrites/expands input — turn it off for precise control.',
    briefForLLM: 'Name the visual style once (e.g. "vector illustration", "poster", "3D render"). Quote any in-image text in double quotes. Skip Magic Prompt padding.',
    targetWords: [20, 40],
    paramSuffix: () => '',
  },
  {
    id: 'firefly',
    name: 'Firefly',
    short: 'Firefly 4',
    badge: 'FF',
    color: 'oklch(0.72 0.14 25)',
    promptStyle: 'NL + structured style controls',
    tips: 'Firefly 4 is commercial-safe-trained (Adobe Stock + licensed). Keep the prompt focused on subject and scene; push style decisions to the dedicated controls (style presets, structure ref, style ref). For photography use, describe camera settings and lighting explicitly. Mention content type: "photo", "vector", "texture", "3D".',
    briefForLLM: 'Subject and scene only — style lives in the UI controls, not the prompt. If photo, one lens/lighting hint; otherwise plain.',
    targetWords: [20, 40],
    paramSuffix: () => '',
  },
  {
    id: 'sdxl',
    name: 'Stable Diffusion XL',
    short: 'SDXL',
    badge: 'SD',
    color: 'oklch(0.72 0.14 310)',
    promptStyle: 'tags + NL hybrid, negatives critical',
    tips: 'SDXL\'s two text encoders reward both comma tags and descriptive phrases. Quality boosters help: "masterpiece, best quality, ultra-detailed". Negative prompts remain essential for removing artifacts — list anatomy issues, lowres, watermarks, etc. LoRA/embedding names work inline. Artist references produce strong style pulls.',
    briefForLLM: 'Comma-separated tags plus one short descriptive phrase. Do not load every quality booster — pick one or two if relevant.',
    targetWords: [20, 40],
    paramSuffix: () => '',
  },
];

const VIDEO_MODELS = [
  {
    id: 'sora',
    name: 'Sora 2',
    short: 'Sora 2',
    badge: 'SO',
    color: 'oklch(0.72 0.14 220)',
    promptStyle: 'prose scene + separate dialogue block',
    tips: 'Sora 2 generates synchronized audio natively. Write the visual scene in prose, then put dialogue in a distinct block BELOW the description so the model separates visual from spoken. Keep lines concise — a 4s shot fits ~1-2 short lines, an 8s shot a few more. Request specific SFX/ambient sounds explicitly. Max 20s on Pro tier. Avoid JSON — natural prose outperforms structured prompts.',
    briefForLLM: 'Prose visual scene. If dialogue, put it in a separate block below. One or two SFX at most — no wall of audio detail.',
    targetWords: [30, 60],
    paramSuffix: () => '',
  },
  {
    id: 'veo2',
    name: 'Veo 3.1',
    short: 'Veo 3.1',
    badge: 'V3',
    color: 'oklch(0.72 0.14 145)',
    promptStyle: '[Cinema]+[Subject]+[Action]+[Context]+[Style]',
    tips: 'Veo 3.1 adds synchronized audio (dialogue, SFX, ambient). Use the 5-part formula: Cinematography + Subject + Action + Context + Style/Ambiance. For speech, use a colon after the action (NOT quotes) to denote dialogue — quotes get rendered as on-screen text. Describe audio in its own sentence. Supports negative prompts. Cinematography vocabulary (35mm, shallow DoF, golden hour, tracking shot) is rewarded.',
    briefForLLM: 'Five-part order: Cinematography, Subject, Action, Context, Style. Dialogue after a colon (not quotes). One audio beat, not three.',
    targetWords: [30, 55],
    paramSuffix: () => '',
  },
  {
    id: 'runway',
    name: 'Runway Gen-4',
    short: 'Gen-4',
    badge: 'RW',
    color: 'oklch(0.72 0.14 25)',
    promptStyle: 'motion/camera focus, refs carry identity',
    tips: 'Gen-4 uses up to 3 reference images for character/object consistency. Let refs handle appearance — the prompt should describe action, camera movement, and atmosphere, not restate what things look like. Reference images inline with @ tags or "image 1"/"image 2" by upload order. Conversational phrasing works. Keep under ~1000 chars.',
    briefForLLM: 'Describe action, camera movement, atmosphere. Refs carry identity — do not restate what things look like.',
    targetWords: [25, 50],
    paramSuffix: () => '',
  },
  {
    id: 'kling',
    name: 'Kling 3.0',
    short: 'Kling 3.0',
    badge: 'KL',
    color: 'oklch(0.72 0.14 55)',
    promptStyle: 'Scene → Subject → Action → Camera → Style',
    tips: 'Kling 3 rewards a strict order: Scene → Characters → Action → Camera → Audio/Style. KEEP IT TIGHT — long prompts confuse the model; aim for 1-3 focused sentences per shot, not paragraphs. Put camera instructions near the start ("slow dolly in", "static camera — subject speaks to lens"); simple motion verbs beat jargon. For multi-shot use timestamps: "[Shot 1] 00:00-00:04: wide establishing…". Image-to-video: describe the MOTION, not the image. First-last-frame: describe the TRANSITION, not either endpoint. Master tier = higher adherence, same grammar.',
    briefForLLM: 'Strict order: Scene → Subject → Action → Camera → Style. 1-3 tight sentences — long prompts hurt Kling. Simple motion verbs beat jargon.',
    targetWords: [15, 35],
    paramSuffix: () => '',
  },
  {
    id: 'seedance',
    name: 'Seedance 2',
    short: 'Seedance 2',
    badge: 'SD',
    color: 'oklch(0.76 0.14 340)',
    promptStyle: 'multi-shot prose, [Image1]/[Video1] refs',
    tips: 'Seedance 2 (ByteDance, Feb 2026) does up to 15s multi-shot with native stereo audio. Duration: 5/10/15s. Aspect: 16:9, 9:16, 4:3, 3:4, 21:9, 1:1. Supports up to 9 images, 3 video clips, 3 audio refs — tag them inline as [Image1], [Video1], [Audio1]. For multi-shot narrative, label shots in the prompt ("Shot 1: …  Shot 2: …") with distinct camera moves per shot. Real-person likenesses are blocked at the model level.',
    briefForLLM: 'Multi-shot prose with "Shot 1:" / "Shot 2:" labels, each with a distinct camera move. Inline [Image1]/[Video1] refs only if provided.',
    targetWords: [40, 80],
    paramSuffix: () => '',
  },
  {
    id: 'pika',
    name: 'Pika 2.5',
    short: 'Pika 2.5',
    badge: 'PK',
    color: 'oklch(0.78 0.12 300)',
    promptStyle: 'concise motion prose + UI effects',
    tips: 'Pika 2.5 keeps Pikaffects (Melt, Explode, Inflate, Squish, Cake-ify, Dissolve, Levitate, Crumble, Peel, Ta-da, etc.) as UI/API presets — don\'t write them in the prompt. Pikaframes = start+end keyframes; prompt describes the interpolation. Ingredients = multi-image compositing; prompt describes how the refs interact. Keep prompts tight: subject + action + environment + camera + style. One main subject.',
    briefForLLM: 'Subject + action + environment + camera + style. One main subject. Never name Pikaffects in the prompt — they are UI presets.',
    targetWords: [20, 40],
    paramSuffix: () => '',
  },
  {
    id: 'luma',
    name: 'Luma Ray 3',
    short: 'Ray 3',
    badge: 'LM',
    color: 'oklch(0.72 0.14 180)',
    promptStyle: 'NL + keyframes, conversational refs',
    tips: 'Ray 3 (on Dream Machine) has HDR output, reasoning-driven generation, and Draft Mode for fast iteration. Natural language with camera verbs (orbit, dolly, push-in). Start/end keyframes give narrative control — text guides the journey between them. Ray 3 Modify supports character-reference + video-to-video; reference \'image1\'/\'cref\' for character, \'image2\' for the target keyframe.',
    briefForLLM: 'Natural language with one camera verb (orbit, dolly, push-in). For keyframes, describe the journey between them — not the endpoints.',
    targetWords: [25, 50],
    paramSuffix: () => '',
  },
];

// Model Selector Component
function ModelSelector({ mode, selectedModel, onSelect }) {
  const models = mode === 'image' ? IMAGE_MODELS : VIDEO_MODELS;
  const current = models.find(m => m.id === selectedModel) || models[0];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 10.5, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, whiteSpace: 'nowrap' }}>
        Target model
      </span>
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {models.map(m => (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            title={m.tips}
            style={{
              appearance: 'none', border: '1px solid',
              borderColor: selectedModel === m.id ? m.color : 'var(--line)',
              background: selectedModel === m.id
                ? `color-mix(in oklch, ${m.color} 18%, var(--bg-2))`
                : 'var(--bg-2)',
              color: selectedModel === m.id ? m.color : 'var(--fg-2)',
              padding: '4px 10px', borderRadius: 6,
              fontSize: 11.5, fontWeight: selectedModel === m.id ? 700 : 500,
              cursor: 'pointer', transition: 'all .12s',
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}
            onMouseOver={e => { if (selectedModel !== m.id) { e.currentTarget.style.color = 'var(--fg-0)'; e.currentTarget.style.borderColor = 'var(--line-2)'; } }}
            onMouseOut={e => { if (selectedModel !== m.id) { e.currentTarget.style.color = 'var(--fg-2)'; e.currentTarget.style.borderColor = 'var(--line)'; } }}
          >
            <span style={{
              width: 16, height: 16, borderRadius: 3,
              background: m.color,
              display: 'inline-grid', placeItems: 'center',
              fontSize: 8, fontWeight: 800, color: 'oklch(0.12 0.02 0)',
              flexShrink: 0,
            }}>{m.badge}</span>
            {m.short}
          </button>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { IMAGE_MODELS, VIDEO_MODELS, ModelSelector });

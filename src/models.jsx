// models.jsx — model definitions + selector component

const IMAGE_MODELS = [
  {
    id: 'midjourney',
    name: 'Midjourney',
    short: 'MJ v7',
    badge: 'MJ',
    color: 'oklch(0.72 0.14 265)',
    promptStyle: 'tag-based with -- parameters',
    tips: 'Use comma-separated descriptive tags. Append --ar, --stylize, --chaos, --v 7 parameters. Avoid full sentences — keywords and adjectives work best. Use :: for weighting.',
    paramSuffix: (fields) => {
      const p = [];
      if (fields.aspectRatio) p.push(`--ar ${fields.aspectRatio}`);
      if (fields.stylize) p.push(`--stylize ${fields.stylize}`);
      if (fields.chaos) p.push(`--chaos ${fields.chaos}`);
      if (fields.mjStyle) p.push(`--style ${fields.mjStyle}`);
      if (fields.mjVersion) p.push(`--v ${fields.mjVersion}`);
      else p.push('--v 7');
      if (fields.seed) p.push(`--seed ${fields.seed}`);
      return p.join(' ');
    },
  },
  {
    id: 'flux',
    name: 'Flux',
    short: 'Flux 1.1',
    badge: 'FL',
    color: 'oklch(0.72 0.14 180)',
    promptStyle: 'natural language, descriptive sentences',
    tips: 'Flux responds best to clear, detailed natural language sentences. Describe lighting, materials, and atmosphere explicitly. No special parameters needed — just vivid prose. Avoid keyword stuffing.',
    paramSuffix: () => '',
  },
  {
    id: 'dalle3',
    name: 'DALL·E 3',
    short: 'DALL·E 3',
    badge: 'D3',
    color: 'oklch(0.72 0.14 145)',
    promptStyle: 'verbose natural language with explicit details',
    tips: 'DALL-E 3 loves verbose, explicit descriptions. Mention style, medium, lighting, mood, composition in full sentences. Include "I want an image of..." framing. More detail = better results.',
    paramSuffix: () => '',
  },
  {
    id: 'ideogram',
    name: 'Ideogram',
    short: 'Ideogram 3',
    badge: 'ID',
    color: 'oklch(0.72 0.14 55)',
    promptStyle: 'natural language, great for text-in-image',
    tips: 'Ideogram excels at rendering text in images. Specify exact text in quotes. Use clear style descriptors. Mention the visual style explicitly (e.g. "vector illustration", "poster design", "3D render").',
    paramSuffix: () => '',
  },
  {
    id: 'firefly',
    name: 'Firefly',
    short: 'Adobe Firefly',
    badge: 'FF',
    color: 'oklch(0.72 0.14 25)',
    promptStyle: 'natural language, photography and design focused',
    tips: 'Adobe Firefly is optimized for professional photography and design use-cases. Describe camera settings, lighting setups, and post-processing looks. Mention content type: "photo", "vector", "texture", "3D".',
    paramSuffix: () => '',
  },
  {
    id: 'sdxl',
    name: 'Stable Diffusion',
    short: 'SDXL',
    badge: 'SD',
    color: 'oklch(0.72 0.14 310)',
    promptStyle: 'tag-based, negative prompts critical',
    tips: 'SDXL uses comma-separated tags. Quality boosters matter: "masterpiece, best quality, ultra-detailed". Negative prompts are very important. Use LoRA/embedding names if applicable. Artist references work well.',
    paramSuffix: () => '',
  },
];

const VIDEO_MODELS = [
  {
    id: 'sora',
    name: 'Sora',
    short: 'Sora',
    badge: 'SO',
    color: 'oklch(0.72 0.14 220)',
    promptStyle: 'detailed scene description, JSON or natural language',
    tips: 'Sora responds to rich, cinematic scene descriptions. Include camera movement, duration, lighting, and temporal progression (what happens over time). Describe the beginning, middle, and end of the clip.',
    paramSuffix: () => '',
  },
  {
    id: 'veo2',
    name: 'Veo 2',
    short: 'Veo 2',
    badge: 'V2',
    color: 'oklch(0.72 0.14 145)',
    promptStyle: 'cinematic natural language, camera-aware',
    tips: 'Veo 2 excels with professional cinematography language. Be explicit about camera movement (slow dolly, tracking shot), lens choice, and lighting conditions. Describe action with precise timing.',
    paramSuffix: () => '',
  },
  {
    id: 'runway',
    name: 'Runway',
    short: 'Gen-4',
    badge: 'RW',
    color: 'oklch(0.72 0.14 25)',
    promptStyle: 'concise action-focused description',
    tips: 'Runway Gen-4 works best with concise, action-focused prompts. Lead with the subject and main action. Keep it under 200 characters when possible. Motion and transformation descriptions are key.',
    paramSuffix: () => '',
  },
  {
    id: 'kling',
    name: 'Kling',
    short: 'Kling 2.0',
    badge: 'KL',
    color: 'oklch(0.72 0.14 55)',
    promptStyle: 'detailed natural language, physics-aware',
    tips: 'Kling handles realistic physics and motion well. Describe physical interactions, material properties, and environmental forces. Good for product demos, nature footage, and realistic human motion.',
    paramSuffix: () => '',
  },
  {
    id: 'pika',
    name: 'Pika',
    short: 'Pika 2.2',
    badge: 'PK',
    color: 'oklch(0.78 0.12 300)',
    promptStyle: 'short, punchy motion descriptions',
    tips: 'Pika excels with short, punchy prompts focused on motion effects and transformations. Use "Pikaffects" style descriptors. Great for creative transitions, morphing, and stylized motion.',
    paramSuffix: () => '',
  },
  {
    id: 'luma',
    name: 'Luma',
    short: 'Dream Machine',
    badge: 'LM',
    color: 'oklch(0.72 0.14 180)',
    promptStyle: 'natural language, smooth motion',
    tips: 'Luma Dream Machine produces smooth, fluid motion. Describe the scene atmosphere and mood alongside action. Works well with nature, abstract, and product footage. Include reference to lighting quality.',
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

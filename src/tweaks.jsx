// tweaks.jsx — tweaks panel
const { useState, useEffect } = React;

const ACCENTS = [
  { id: 'ember', color: 'oklch(0.72 0.14 45)', label: 'Ember' },
  { id: 'iris', color: 'oklch(0.72 0.14 285)', label: 'Iris' },
  { id: 'fern', color: 'oklch(0.72 0.14 155)', label: 'Fern' },
  { id: 'citron', color: 'oklch(0.82 0.14 100)', label: 'Citron' },
];

const PROVIDERS = [
  {
    id: 'anthropic',
    label: 'Claude',
    keyStorage: 'vp_anthropic_key',
    modelStorage: 'vp_anthropic_model',
    placeholder: 'sk-ant-...',
    signup: 'https://console.anthropic.com/settings/keys',
    signupLabel: 'console.anthropic.com',
    models: [
      { id: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5 (fast)' },
      { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6 (balanced)' },
      { id: 'claude-opus-4-7', label: 'Opus 4.7 (strongest)' },
    ],
  },
  {
    id: 'openai',
    label: 'OpenAI',
    keyStorage: 'vp_openai_key',
    modelStorage: 'vp_openai_model',
    placeholder: 'sk-...',
    signup: 'https://platform.openai.com/api-keys',
    signupLabel: 'platform.openai.com',
    models: [
      { id: 'gpt-5.4', label: 'GPT-5.4 (newest)' },
      { id: 'gpt-5-nano', label: 'GPT-5 nano (fastest)' },
      { id: 'gpt-5-mini', label: 'GPT-5 mini (balanced)' },
      { id: 'gpt-5', label: 'GPT-5' },
      { id: 'gpt-4o-mini', label: 'GPT-4o mini' },
      { id: 'gpt-4o', label: 'GPT-4o' },
    ],
  },
  {
    id: 'gemini',
    label: 'Gemini',
    keyStorage: 'vp_gemini_key',
    modelStorage: 'vp_gemini_model',
    placeholder: 'AIza...',
    signup: 'https://aistudio.google.com/apikey',
    signupLabel: 'aistudio.google.com',
    models: [
      { id: 'gemini-3.1-pro', label: 'Gemini 3.1 Pro (newest)' },
      { id: 'gemini-3.1-flash', label: 'Gemini 3.1 Flash' },
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    ],
  },
];

function ChatProviderField() {
  const [provider, setProvider] = useState(() => localStorage.getItem('vp_provider') || 'anthropic');
  const cfg = PROVIDERS.find(p => p.id === provider) || PROVIDERS[0];

  const [key, setKey] = useState(() => localStorage.getItem(cfg.keyStorage) || '');
  const [model, setModel] = useState(() => localStorage.getItem(cfg.modelStorage) || cfg.models[0].id);
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  // reload key/model when provider changes
  useEffect(() => {
    setKey(localStorage.getItem(cfg.keyStorage) || '');
    setModel(localStorage.getItem(cfg.modelStorage) || cfg.models[0].id);
    setSaved(false);
  }, [provider]);

  const pickProvider = (id) => {
    setProvider(id);
    localStorage.setItem('vp_provider', id);
  };
  const pickModel = (id) => {
    setModel(id);
    localStorage.setItem(cfg.modelStorage, id);
  };
  const saveKey = () => {
    localStorage.setItem(cfg.keyStorage, key.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };
  const clearKey = () => {
    setKey('');
    localStorage.removeItem(cfg.keyStorage);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="tw-opts" style={{ flexWrap: 'wrap' }}>
        {PROVIDERS.map(p => (
          <button
            key={p.id}
            className="tw-opt"
            aria-pressed={provider === p.id}
            onClick={() => pickProvider(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type={show ? 'text' : 'password'}
          value={key}
          onChange={e => setKey(e.target.value)}
          placeholder={cfg.placeholder}
          spellCheck={false}
          autoComplete="off"
          style={{
            flex: 1, minWidth: 0,
            background: 'var(--bg-3)', color: 'var(--fg-0)',
            border: '1px solid var(--line-2)', borderRadius: 6,
            padding: '6px 8px', fontSize: 12,
            fontFamily: 'var(--font-mono)',
          }}
        />
        <button className="tw-opt" onClick={() => setShow(s => !s)} title={show ? 'Hide' : 'Show'}>
          {show ? 'Hide' : 'Show'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <button className="tw-opt" aria-pressed={saved} onClick={saveKey} disabled={!key.trim()}>
          {saved ? '✓ Saved' : 'Save key'}
        </button>
        <button className="tw-opt" onClick={clearKey} disabled={!key}>Clear</button>
      </div>

      <div className="tw-lbl" style={{ marginTop: 2 }}>Model</div>
      <div className="tw-opts" style={{ flexWrap: 'wrap' }}>
        {cfg.models.map(m => (
          <button key={m.id} className="tw-opt" aria-pressed={model === m.id} onClick={() => pickModel(m.id)}>
            {m.label}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 10.5, color: 'var(--fg-4)', lineHeight: 1.5 }}>
        Keys stored in this browser only. Get a {cfg.label} key at{' '}
        <a href={cfg.signup} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
          {cfg.signupLabel}
        </a>.
      </div>
    </div>
  );
}

function TweaksPanel({ tweaks, onTweak, onClose }) {
  return (
    <div className="tweaks-panel">
      <div className="tweaks-head">
        Tweaks
        <button className="iconbtn ghost" style={{ padding: '2px 6px' }} onClick={onClose}><Icons.Close /></button>
      </div>
      <div className="tweaks-body">

        <div className="tw-row">
          <div className="tw-lbl">AI Provider & Key</div>
          <ChatProviderField />
        </div>

        <div className="tw-row">
          <div className="tw-lbl">Accent Color</div>
          <div className="tw-opts" style={{ gap: '8px' }}>
            {ACCENTS.map(a => (
              <div
                key={a.id}
                className="color-swatch"
                style={{ background: a.color }}
                aria-pressed={tweaks.accent === a.id}
                title={a.label}
                onClick={() => onTweak('accent', a.id)}
              />
            ))}
          </div>
        </div>

        <div className="tw-row">
          <div className="tw-lbl">Default Mode</div>
          <div className="tw-opts">
            {['image', 'video'].map(m => (
              <button key={m} className="tw-opt" aria-pressed={tweaks.mode === m} onClick={() => onTweak('mode', m)}>
                {m === 'image' ? '🖼 Image' : '🎬 Video'}
              </button>
            ))}
          </div>
        </div>

        <div className="tw-row">
          <div className="tw-lbl">Chat Panel</div>
          <div className="tw-opts">
            {[['visible', true], ['hidden', false]].map(([label, val]) => (
              <button key={label} className="tw-opt" aria-pressed={tweaks.showChat === val} onClick={() => onTweak('showChat', val)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="tw-row">
          <div className="tw-lbl">Typography</div>
          <div className="tw-opts">
            {[['Serif titles', true], ['Sans titles', false]].map(([label, val]) => (
              <button key={label} className="tw-opt" aria-pressed={tweaks.serifTitle === val} onClick={() => onTweak('serifTitle', val)}>
                {label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

Object.assign(window, { TweaksPanel, ACCENTS });

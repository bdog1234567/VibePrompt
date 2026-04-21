// tweaks.jsx — tweaks panel
const { useState, useEffect } = React;

const ACCENTS = [
  { id: 'ember', color: 'oklch(0.72 0.14 45)', label: 'Ember' },
  { id: 'iris', color: 'oklch(0.72 0.14 285)', label: 'Iris' },
  { id: 'fern', color: 'oklch(0.72 0.14 155)', label: 'Fern' },
  { id: 'citron', color: 'oklch(0.82 0.14 100)', label: 'Citron' },
];

const CLAUDE_MODELS = [
  { id: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5 (fast)' },
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6 (balanced)' },
  { id: 'claude-opus-4-7', label: 'Opus 4.7 (strongest)' },
];

function ApiKeyField() {
  const [key, setKey] = useState(() => localStorage.getItem('vp_anthropic_key') || '');
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);
  const save = () => {
    localStorage.setItem('vp_anthropic_key', key.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };
  const clear = () => {
    setKey('');
    localStorage.removeItem('vp_anthropic_key');
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type={show ? 'text' : 'password'}
          value={key}
          onChange={e => setKey(e.target.value)}
          placeholder="sk-ant-..."
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
        <button className="tw-opt" aria-pressed={saved} onClick={save} disabled={!key.trim()}>
          {saved ? '✓ Saved' : 'Save key'}
        </button>
        <button className="tw-opt" onClick={clear} disabled={!key}>Clear</button>
      </div>
      <div style={{ fontSize: 10.5, color: 'var(--fg-4)', lineHeight: 1.5 }}>
        Stored in this browser only. Get a key at{' '}
        <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
          console.anthropic.com
        </a>.
      </div>
    </div>
  );
}

function ClaudeModelField() {
  const [model, setModel] = useState(() => localStorage.getItem('vp_anthropic_model') || CLAUDE_MODELS[0].id);
  const pick = (id) => {
    setModel(id);
    localStorage.setItem('vp_anthropic_model', id);
  };
  return (
    <div className="tw-opts" style={{ flexWrap: 'wrap' }}>
      {CLAUDE_MODELS.map(m => (
        <button key={m.id} className="tw-opt" aria-pressed={model === m.id} onClick={() => pick(m.id)}>
          {m.label}
        </button>
      ))}
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
          <div className="tw-lbl">Anthropic API Key</div>
          <ApiKeyField />
        </div>

        <div className="tw-row">
          <div className="tw-lbl">Chat Model</div>
          <ClaudeModelField />
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

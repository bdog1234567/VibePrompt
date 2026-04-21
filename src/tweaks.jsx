// tweaks.jsx — tweaks panel
const { useState, useEffect } = React;

const ACCENTS = [
  { id: 'ember', color: 'oklch(0.72 0.14 45)', label: 'Ember' },
  { id: 'iris', color: 'oklch(0.72 0.14 285)', label: 'Iris' },
  { id: 'fern', color: 'oklch(0.72 0.14 155)', label: 'Fern' },
  { id: 'citron', color: 'oklch(0.82 0.14 100)', label: 'Citron' },
];

function TweaksPanel({ tweaks, onTweak, onClose }) {
  return (
    <div className="tweaks-panel">
      <div className="tweaks-head">
        Tweaks
        <button className="iconbtn ghost" style={{ padding: '2px 6px' }} onClick={onClose}><Icons.Close /></button>
      </div>
      <div className="tweaks-body">

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

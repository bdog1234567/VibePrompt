// output.jsx — multi-format output panel
const { useState, useCallback } = React;

function copyToClipboard(text) {
  // Try modern API first
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
  ta.focus();
  ta.select();
  try { document.execCommand('copy'); } catch(e) {}
  document.body.removeChild(ta);
}

function CopyBtn({ text, small }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    copyToClipboard(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
  };
  return (
    <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={copy}>
      {copied ? <><Icons.Check /> Copied!</> : <><Icons.Copy /> Copy</>}
    </button>
  );
}

// Syntax-highlighted JSON
function JsonView({ text }) {
  if (!text || text === '{}') return <div className="out-text mono empty">Fill in fields to generate JSON…</div>;
  const highlighted = text
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
      let cls = 'num';
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? 'key' : 'str';
      } else if (/true|false/.test(match)) {
        cls = 'param';
      }
      return `<span class="${cls}">${match}</span>`;
    });
  return <div className="out-text mono" dangerouslySetInnerHTML={{ __html: highlighted }} />;
}

// Params view with colored tokens
function ParamsView({ text, natural }) {
  if (!natural && !text) return <div className="out-text mono empty">Fill in fields to generate params…</div>;
  const full = [natural, text].filter(Boolean).join(' ');
  const parts = full.split(/(--\w+)/g);
  return (
    <div className="out-text mono">
      {parts.map((p, i) =>
        p.startsWith('--')
          ? <span key={i} className="param">{p}</span>
          : <span key={i} className="val">{p}</span>
      )}
    </div>
  );
}

const TABS = [
  { id: 'natural', label: 'Natural', icon: '✦' },
  { id: 'json', label: 'JSON', icon: '{ }' },
  { id: 'tags', label: 'Tags', icon: '#' },
  { id: 'params', label: 'Params', icon: '--' },
  { id: 'negative', label: 'Negative', icon: '∅' },
];

function OutputPane({ compiled, fields, onSave }) {
  const [tab, setTab] = useState('natural');
  const [saveName, setSaveName] = useState('');

  const { natural, json, tags, params, negative } = compiled;
  const wordCount = natural ? natural.split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="pane pane-out" style={{ background: 'var(--bg-0)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div className="out-tabs">
        {TABS.map(t => (
          <button key={t.id} className="out-tab" aria-pressed={tab === t.id} onClick={() => setTab(t.id)}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', opacity: .7 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="out-body">

        {tab === 'natural' && (
          <>
            <div className="out-label">Natural Language Prompt</div>
            <div className="out-card">
              <div className={`out-text ${!natural ? 'empty' : ''}`}>
                {natural || 'Start filling in fields or chat with the AI to build your prompt…'}
              </div>
              {natural && <CopyBtn text={natural} />}
            </div>
            {natural && (
              <div style={{ fontSize: '11px', color: 'var(--fg-3)', marginTop: '-4px' }}>
                {wordCount} words · {natural.length} chars
              </div>
            )}
          </>
        )}

        {tab === 'json' && (
          <>
            <div className="out-label">Structured JSON (Sora / Veo style)</div>
            <div className="out-card">
              <JsonView text={json} />
              {json && json !== '{}' && <CopyBtn text={json} />}
            </div>
          </>
        )}

        {tab === 'tags' && (
          <>
            <div className="out-label">Comma-separated Tags</div>
            <div className="out-card" style={{ position: 'relative' }}>
              {tags && tags.length > 0
                ? <>
                    <div className="out-chips">
                      {tags.map((t, i) => <span key={i} className="out-chip">{t}</span>)}
                    </div>
                    <CopyBtn text={tags.join(', ')} />
                  </>
                : <div className="out-text empty">Tags will appear here…</div>
              }
            </div>
            {tags && tags.length > 0 && (
              <div className="out-card">
                <div className="out-text mono">{tags.join(', ')}</div>
                <CopyBtn text={tags.join(', ')} />
              </div>
            )}
          </>
        )}

        {tab === 'params' && (
          <>
            <div className="out-label">Full Prompt + Parameters</div>
            <div className="out-card">
              <ParamsView
                natural={natural}
                text={params && params.length ? params.join(' ') : ''}
              />
              {(natural || params?.length) && (
                <CopyBtn text={[natural, ...(params || [])].filter(Boolean).join(' ')} />
              )}
            </div>
            {params && params.length > 0 && (
              <>
                <div className="out-label" style={{ marginTop: '4px' }}>Parameters only</div>
                <div className="out-card">
                  <div className="out-text mono">
                    {params.map((p, i) => {
                      const parts = p.split(/\s+/);
                      return (
                        <span key={i}>
                          <span className="param">{parts[0]}</span>
                          {parts[1] && <span className="val"> {parts[1]}</span>}
                          {' '}
                        </span>
                      );
                    })}
                  </div>
                  <CopyBtn text={params.join(' ')} />
                </div>
              </>
            )}
          </>
        )}

        {tab === 'negative' && (
          <>
            <div className="out-label">Negative Prompt</div>
            <div className={`out-card out-neg`}>
              <div className={`out-text ${!negative ? 'empty' : ''}`}>
                {negative || 'Add things to avoid in the Negative Prompt section of the editor…'}
              </div>
              {negative && <CopyBtn text={negative} />}
            </div>
            {negative && (
              <div className="out-card" style={{ marginTop: 4 }}>
                <div className="out-text mono" style={{ fontSize: '11px' }}>
                  <span className="param">--no </span>
                  <span className="val">{negative}</span>
                </div>
                <CopyBtn text={`--no ${negative}`} />
              </div>
            )}
          </>
        )}

      </div>

      <div className="save-bar">
        <input
          className="inp"
          style={{ fontSize: '12px', padding: '6px 10px' }}
          placeholder="Name this prompt…"
          value={saveName}
          onChange={e => setSaveName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && saveName.trim()) { onSave(saveName.trim()); setSaveName(''); } }}
        />
        <button
          className="iconbtn primary"
          style={{ fontSize: '12px', padding: '6px 12px' }}
          disabled={!saveName.trim() || !natural}
          onClick={() => { onSave(saveName.trim()); setSaveName(''); }}
        >
          <Icons.Save /> Save
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { OutputPane });

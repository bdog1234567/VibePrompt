// app.jsx — main app shell
const { useState, useEffect, useCallback, useRef } = React;

function PaneDivider({ onMouseDown, onDoubleClick, hidden }) {
  return (
    <div
      className={`pane-divider${hidden ? ' hidden' : ''}`}
      onMouseDown={hidden ? undefined : onMouseDown}
      onDoubleClick={hidden ? undefined : onDoubleClick}
    />
  );
}

const EMPTY_FIELDS = {
  subject: '', action: '', setting: '',
  time: '', weather: '', mood: '', colorTone: '',
  lens: '', composition: '', film: '', dof: '',
  cameraMove: '', pacing: '', audio: '', duration: 10, fps: '24',
  styles: [], artists: [], quality: [], negative: [],
  aspectRatio: '16:9', mjVersion: '7', stylize: 100, chaos: 0,
  mjStyle: '', seed: '',
};

function useLocalStorage(key, def) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : def; } catch { return def; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }, [val, key]);
  return [val, setVal];
}

const PROVIDER_KEY_MAP = {
  anthropic: { key: 'vp_anthropic_key', label: 'Claude' },
  openai: { key: 'vp_openai_key', label: 'OpenAI' },
  gemini: { key: 'vp_gemini_key', label: 'Gemini' },
};

function currentProviderStatus() {
  const id = (localStorage.getItem('vp_provider') || 'anthropic').toLowerCase();
  const cfg = PROVIDER_KEY_MAP[id] || PROVIDER_KEY_MAP.anthropic;
  return {
    providerLabel: cfg.label,
    hasKey: !!(localStorage.getItem(cfg.key) || '').trim(),
  };
}

function ApiKeyBanner({ onOpenTweaks }) {
  const [status, setStatus] = useState(currentProviderStatus);
  useEffect(() => {
    const check = () => setStatus(currentProviderStatus());
    window.addEventListener('storage', check);
    const iv = setInterval(check, 1500);
    return () => { window.removeEventListener('storage', check); clearInterval(iv); };
  }, []);
  if (status.hasKey) return null;
  return (
    <div className="api-banner">
      <span className="api-banner-dot" />
      <span className="api-banner-text">
        <strong>Chat is off</strong> — pick a provider (Claude / OpenAI / Gemini) and add a key.
      </span>
      <button className="iconbtn primary" onClick={onOpenTweaks}>
        <Icons.Sliders /> Add key
      </button>
    </div>
  );
}

function App() {
  const [mode, setMode] = useLocalStorage('vp_mode', window.TWEAKS?.mode || 'video');
  const [imageModel, setImageModel] = useLocalStorage('vp_image_model', 'midjourney');
  const [videoModel, setVideoModel] = useLocalStorage('vp_video_model', 'sora');
  const [chatKey, setChatKey] = useState(0);
  const [paneSizes, setPaneSizes] = useLocalStorage('vp_pane_sizes', { chat: 300, output: 410 });
  const dragRef = useRef(null);
  const modelId = mode === 'image' ? imageModel : mode === 'video' ? videoModel : 'general';
  const setModelId = mode === 'image' ? setImageModel : mode === 'video' ? setVideoModel : () => {};
  const [fields, setFields] = useLocalStorage('vp_fields', EMPTY_FIELDS);
  const [library, setLibrary] = useLocalStorage('vp_library', []);
  const [view, setView] = useState('editor'); // 'editor' | 'library'
  const [tweaks, setTweaks] = useLocalStorage('vp_tweaks', window.TWEAKS || { accent: 'ember', showChat: true, serifTitle: true, mode: 'video' });
  const [showTweaks, setShowTweaks] = useState(false);
  const [mobilePane, setMobilePane] = useState('editor');

  // apply tweaks to DOM
  useEffect(() => {
    document.documentElement.dataset.accent = tweaks.accent || 'ember';
  }, [tweaks.accent]);

  // Tweaks editmode bridge
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode') setShowTweaks(true);
      if (e.data?.type === '__deactivate_edit_mode') setShowTweaks(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const handleTweak = (key, val) => {
    const next = { ...tweaks, [key]: val };
    setTweaks(next);
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: val } }, '*');
  };

  // live compile
  const compiled = (() => {
    const { compileNatural, compileJSON, compileTags, compileParams, compileNegative } = window.Compile;
    return {
      natural: compileNatural(fields, mode),
      json: compileJSON(fields, mode),
      tags: compileTags(fields, mode),
      params: compileParams(fields, mode, modelId),
      negative: compileNegative(fields),
    };
  })();

  // apply chat suggestion to fields
  const handleChatApply = useCallback(({ field, value }) => {
    setFields(prev => {
      if (Array.isArray(prev[field])) {
        const arr = Array.isArray(value) ? value : [value];
        return { ...prev, [field]: [...new Set([...prev[field], ...arr])] };
      }
      return { ...prev, [field]: value };
    });
  }, []);

  const savePrompt = (name) => {
    const entry = {
      id: Date.now(),
      name,
      mode,
      fields: { ...fields },
      natural: compiled.natural,
      savedAt: Date.now(),
    };
    setLibrary(prev => [entry, ...prev]);
  };

  const loadPrompt = (item) => {
    setMode(item.mode);
    setFields(item.fields);
    setView('editor');
  };

  const deletePrompt = (id) => setLibrary(prev => prev.filter(x => x.id !== id));

  const clearFields = () => {
    if (confirm('Clear all fields, saved prompts, and chat history?')) {
      setFields(EMPTY_FIELDS);
      setLibrary([]);
      setChatKey(k => k + 1);
    }
  };

  const clearChat = () => {
    if (confirm('Clear chat history?')) setChatKey(k => k + 1);
  };

  const startDrag = (side, e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startSizes = { chat: paneSizes.chat, output: paneSizes.output };
    const handleMove = (ev) => {
      const delta = ev.clientX - startX;
      if (side === 'chat') {
        setPaneSizes(s => ({ ...s, chat: Math.max(200, Math.min(600, startSizes.chat + delta)) }));
      } else {
        setPaneSizes(s => ({ ...s, output: Math.max(260, Math.min(700, startSizes.output - delta)) }));
      }
    };
    const handleUp = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  const showChat = tweaks.showChat !== false;

  return (
    <div className="app">
      {/* TOP BAR */}
      <div className="topbar">
        <div className="brand">
          <div className="mark" />
          Vibe<em>Prompt</em>
        </div>

        <div className="mode-switch">
          <button aria-pressed={mode === 'image'} onClick={() => setMode('image')}>
            <Icons.Image /> Image
          </button>
          <button aria-pressed={mode === 'video'} onClick={() => setMode('video')}>
            <Icons.Video /> Video
          </button>
          <button aria-pressed={mode === 'general'} onClick={() => setMode('general')}>
            ✦ General
          </button>
        </div>

        <div className="topbar" style={{ flex: 1, border: 0, background: 'transparent', padding: 0, gap: 6 }}>
          <button
            className={`iconbtn ${view === 'editor' ? 'active' : ''}`}
            onClick={() => setView('editor')}
          >
            <Icons.Wand /> Editor
          </button>
          <button
            className={`iconbtn ${view === 'library' ? 'active' : ''}`}
            onClick={() => setView('library')}
          >
            <Icons.Book /> Library
            {library.length > 0 && (
              <span style={{
                background: 'var(--accent)', color: 'var(--accent-ink)',
                borderRadius: '999px', fontSize: '10px', fontWeight: 700,
                padding: '1px 5px', marginLeft: '2px',
              }}>{library.length}</span>
            )}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button className="iconbtn ghost" onClick={clearFields} title="Clear all fields, saves, and chat">
            <Icons.Trash /> Reset
          </button>
          <button className="iconbtn ghost" onClick={() => setShowTweaks(s => !s)} title="Tweaks">
            <Icons.Sliders /> Tweaks
          </button>
          <div className="ai-ready" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '3px 10px', background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 999 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)', display: 'inline-block' }} />
            <span style={{ fontSize: '11px', color: 'var(--fg-2)' }}>AI Ready</span>
          </div>
        </div>
      </div>

      {/* MODEL SUBBAR */}
      <div className="subbar">
        <ModelSelector mode={mode} selectedModel={modelId} onSelect={setModelId} />
      </div>

      {/* API KEY BANNER */}
      <ApiKeyBanner onOpenTweaks={() => setShowTweaks(true)} />

      {/* MOBILE PANE SWITCHER */}
      <div className="mobile-panes">
        <button aria-pressed={mobilePane === 'chat'} onClick={() => setMobilePane('chat')}>
          <Icons.Chat /> Chat
        </button>
        <button aria-pressed={mobilePane === 'editor'} onClick={() => setMobilePane('editor')}>
          <Icons.Wand /> Editor
        </button>
        <button aria-pressed={mobilePane === 'output'} onClick={() => setMobilePane('output')}>
          <Icons.Copy /> Output
        </button>
      </div>

      {/* MAIN */}
      <div
        className={`main ${showChat ? '' : 'hide-chat'}`}
        data-mpane={mobilePane}
        style={{
          flex: 1, minHeight: 0,
          gridTemplateColumns: showChat
            ? `${paneSizes.chat}px 10px 1fr 10px ${paneSizes.output}px`
            : `0 0 1fr 10px ${paneSizes.output}px`,
        }}
      >

        {/* CHAT */}
        <div className="pane pane-chat" style={{ background: 'var(--bg-1)' }}>
          <div className="pane-head">
            <Icons.Chat />
            Creative Director
            <span className="pane-head spacer" />
            <button className="iconbtn ghost" style={{ padding: '2px 6px' }} onClick={() => setPaneSizes(s => ({ ...s, chat: Math.max(200, s.chat - 60) }))} title="Shrink chat">‹</button>
            <button className="iconbtn ghost" style={{ padding: '2px 6px' }} onClick={() => setPaneSizes(s => ({ ...s, chat: Math.min(600, s.chat + 60) }))} title="Expand chat">›</button>
            <button className="iconbtn ghost" style={{ padding: '2px 6px' }} onClick={clearChat} title="Clear chat history">
              <Icons.Trash />
            </button>
            <button className="iconbtn ghost" style={{ padding: '2px 6px' }} onClick={() => handleTweak('showChat', false)} title="Hide chat">
              <Icons.Close />
            </button>
          </div>
          <ChatPane
            key={chatKey}
            fields={fields}
            onApply={handleChatApply}
            onApplyAll={(prompt) => {
              if (prompt) setFields(prev => ({ ...prev, subject: prompt }));
              setView('editor');
            }}
            mode={mode}
            modelId={modelId}
          />
        </div>

        <PaneDivider
          hidden={!showChat}
          onMouseDown={(e) => startDrag('chat', e)}
          onDoubleClick={() => setPaneSizes(s => ({ ...s, chat: 300 }))}
        />

        {/* EDITOR / LIBRARY */}
        <div className="pane pane-editor" style={{ background: 'var(--bg-0)' }}>
          <div className="pane-head">
            {view === 'editor' ? (
              <>
                Prompt Editor
                <span style={{ color: 'var(--accent)', marginLeft: 4 }}>· {mode}</span>
                <span style={{ flex: 1 }} />
                {!showChat && (
                  <button className="iconbtn ghost" style={{ padding: '3px 8px', fontSize: '11px' }} onClick={() => handleTweak('showChat', true)}>
                    <Icons.Chat /> Show AI
                  </button>
                )}
              </>
            ) : (
              <>
                Saved Library
                <span style={{ flex: 1 }} />
              </>
            )}
          </div>
          {view === 'editor'
            ? <EditorPane fields={fields} onChange={setFields} mode={mode} />
            : <LibraryPane library={library} onLoad={loadPrompt} onDelete={deletePrompt} />
          }
        </div>

        <PaneDivider
          onMouseDown={(e) => startDrag('output', e)}
          onDoubleClick={() => setPaneSizes(s => ({ ...s, output: 410 }))}
        />

        {/* OUTPUT */}
        <OutputPane
          compiled={compiled}
          fields={fields}
          onSave={savePrompt}
          onResize={(delta) => setPaneSizes(s => ({ ...s, output: Math.max(260, Math.min(700, s.output + delta)) }))}
        />

      </div>

      <div className="statusbar">
        <span className="dot" />
        <span>VibePrompt Studio</span>
        <span style={{ opacity: .4 }}>·</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}>{mode} mode</span>
        <span style={{ opacity: .4 }}>·</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
          {([...(window.GENERAL_MODEL ? [window.GENERAL_MODEL] : []), ...(window.IMAGE_MODELS||[]), ...(window.VIDEO_MODELS||[])].find(m => m.id === modelId) || {}).short || modelId}
        </span>
        {compiled.natural && (
          <>
            <span style={{ opacity: .4 }}>·</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}>{compiled.natural.length} chars</span>
          </>
        )}
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: '10.5px', color: 'var(--fg-4)' }}>{library.length} saved prompt{library.length !== 1 ? 's' : ''}</span>
      </div>

      {/* TWEAKS */}
      {showTweaks && (
        <TweaksPanel tweaks={tweaks} onTweak={handleTweak} onClose={() => setShowTweaks(false)} />
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

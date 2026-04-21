// library.jsx — saved prompt library
const { useState } = React;

function LibraryPane({ library, onLoad, onDelete, currentFields }) {
  const [search, setSearch] = useState('');

  const filtered = library.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    (item.natural || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
        <input
          className="inp"
          style={{ fontSize: '12px', padding: '6px 10px' }}
          placeholder="Search saved prompts…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="pane-scroll" style={{ flex: 1 }}>
        {filtered.length === 0 ? (
          <div className="lib-empty">
            <div className="icon">☁</div>
            {library.length === 0
              ? 'No saved prompts yet. Build a prompt and save it!'
              : 'No prompts match your search.'}
          </div>
        ) : (
          filtered.map(item => (
            <div key={item.id} className="lib-item">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <div className="lib-name">{item.name}</div>
                  <div className="lib-preview">{item.natural}</div>
                  <div className="lib-meta">
                    <span className="lib-mode">{item.mode}</span>
                    <span>{new Date(item.savedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '5px', flexShrink: 0, marginTop: '2px' }}>
                  <button className="iconbtn ghost" style={{ padding: '4px 8px' }} onClick={() => onLoad(item)} title="Load">
                    <Icons.Wand />
                  </button>
                  <button className="iconbtn ghost" style={{ padding: '4px 8px', color: 'var(--fg-3)' }} onClick={() => onDelete(item.id)} title="Delete">
                    <Icons.Trash />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

Object.assign(window, { LibraryPane });

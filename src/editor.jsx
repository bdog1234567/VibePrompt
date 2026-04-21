// editor.jsx — structured prompt form
const { useState, useRef } = React;

// ---- chip row component ----
function ChipRow({ values = [], suggestions = [], onChange }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const inpRef = useRef(null);

  const remove = (v) => onChange(values.filter(x => x !== v));
  const add = (v) => {
    const val = v.trim();
    if (val && !values.includes(val)) onChange([...values, val]);
    setDraft(''); setAdding(false);
  };
  const addSug = (s) => { if (!values.includes(s)) onChange([...values, s]); };

  return (
    <div className="chiprow">
      {values.map(v => (
        <span key={v} className="tag">
          {v}
          <button onClick={() => remove(v)} title="Remove">✕</button>
        </span>
      ))}
      {suggestions.filter(s => !values.includes(s)).slice(0, 4).map(s => (
        <span key={s} className="tag sug" onClick={() => addSug(s)} title="Add">+ {s}</span>
      ))}
      {adding ? (
        <input
          ref={inpRef}
          autoFocus
          className="add-chip-inp"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') add(draft);
            if (e.key === 'Escape') { setAdding(false); setDraft(''); }
          }}
          onBlur={() => { if (draft) add(draft); else setAdding(false); }}
          placeholder="Type & Enter…"
        />
      ) : (
        <button className="add-chip" onClick={() => setAdding(true)}>+ Add</button>
      )}
    </div>
  );
}

// ---- collapsible section ----
function Section({ idx, title, preview, defaultOpen = false, children, cols = 2 }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`section ${open ? 'open' : ''}`}>
      <div className="section-head" onClick={() => setOpen(o => !o)}>
        <span className="s-idx">{String(idx).padStart(2,'0')}</span>
        <span className="s-title">{title}</span>
        {!open && preview && <span className="s-preview">{preview}</span>}
        <span style={{flex:1}}/>
        <span className="s-caret"><Icons.Caret /></span>
      </div>
      {open && (
        <div className={`section-body ${cols === 1 ? 'cols-1' : ''}`}>
          {children}
        </div>
      )}
    </div>
  );
}

// ---- select field ----
function Sel({ label, value, onChange, options }) {
  return (
    <div className="field">
      <label>{label}</label>
      <select className="sel" value={value} onChange={e => onChange(e.target.value)}>
        <option value="">— none —</option>
        {options.map(o => (
          <option key={o.value || o} value={o.value || o}>{o.label || o}</option>
        ))}
      </select>
    </div>
  );
}

// ---- text field ----
function Txt({ label, value, onChange, placeholder, full }) {
  return (
    <div className={`field ${full ? 'span2' : ''}`}>
      <label>{label}</label>
      <input className="inp" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || ''} />
    </div>
  );
}

// ---- textarea field ----
function TArea({ label, value, onChange, placeholder, full }) {
  return (
    <div className={`field ${full ? 'span2' : ''}`}>
      <label>{label}</label>
      <textarea className="ta" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || ''} rows={3} />
    </div>
  );
}

// ---- segmented field ----
function Seg({ label, value, onChange, options }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="seg">
        {options.map(o => (
          <button key={o} aria-pressed={value === o} onClick={() => onChange(o)}>{o}</button>
        ))}
      </div>
    </div>
  );
}

// ---- slider field ----
function Slider({ label, value, onChange, min, max, step = 1, unit = '' }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="slider-row">
        <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
        <output>{value}{unit}</output>
      </div>
    </div>
  );
}

// ---------- EDITOR ----------
const STYLE_SUGGESTIONS = {
  image: ['cinematic', 'photorealistic', 'oil painting', 'watercolor', 'cyberpunk', 'noir', 'impressionist', 'editorial', 'documentary'],
  video: ['cinematic', 'documentary', 'music video', 'commercial', 'art house', 'found footage', 'stop motion', 'slow motion'],
};
const ARTIST_SUGGESTIONS = {
  image: ['Annie Leibovitz', 'Gregory Crewdson', 'Ansel Adams', 'Vivian Maier', 'Steve McCurry', 'Sebastião Salgado'],
  video: ['Roger Deakins', 'Emmanuel Lubezki', 'Wong Kar-wai', 'Stanley Kubrick', 'Denis Villeneuve', 'Sofia Coppola'],
};
const QUALITY_SUGGESTIONS = ['8K', 'ultra-detailed', 'HDR', 'sharp focus', 'award-winning', 'masterpiece', 'RAW', 'uncompressed'];
const NEGATIVE_SUGGESTIONS = ['blurry', 'low quality', 'watermark', 'text', 'logo', 'extra limbs', 'disfigured', 'oversaturated', 'noise', 'grain', 'cropped', 'JPEG artifacts'];

function EditorPane({ fields, onChange, mode }) {
  const set = (key) => (val) => onChange({ ...fields, [key]: val });

  const preview = (keys) => keys.map(k => fields[k]).filter(Boolean).join(' · ') || '—';

  return (
    <div className="pane-scroll">
      <div className="editor">

        {/* CORE */}
        <Section idx={1} title="Core Scene" defaultOpen preview={preview(['subject','action','setting'])}>
          <TArea label="Subject" value={fields.subject} onChange={set('subject')} placeholder="A lone astronaut, an elderly woman, a pack of wolves…" full />
          <TArea label="Action / Motion" value={fields.action} onChange={set('action')} placeholder="walking through dust, reaching toward the light…" full />
          <Txt label="Setting / Location" value={fields.setting} onChange={set('setting')} placeholder="a neon-lit alley, Icelandic tundra, 1950s diner…" full />
        </Section>

        {/* LIGHT & ATMOS */}
        <Section idx={2} title="Light & Atmosphere" preview={preview(['time','weather'])}>
          <Sel label="Time of Day" value={fields.time} onChange={set('time')} options={['golden hour','blue hour','midday','overcast','night','dawn','dusk','midnight']} />
          <Sel label="Weather / Atmosphere" value={fields.weather} onChange={set('weather')} options={['clear','foggy','rainy','stormy','snowy','hazy','smoky','dusty','misty']} />
          <Sel label="Mood" value={fields.mood} onChange={set('mood')} options={['melancholic','euphoric','tense','serene','mysterious','epic','intimate','unsettling','hopeful','nostalgic']} />
          <Txt label="Color Palette / Tone" value={fields.colorTone} onChange={set('colorTone')} placeholder="desaturated teal, warm amber, monochromatic…" />
        </Section>

        {/* CAMERA */}
        {mode === 'image' ? (
          <Section idx={3} title="Camera & Composition" preview={preview(['lens','composition'])}>
            <Sel label="Lens / Focal Length" value={fields.lens} onChange={set('lens')} options={['14mm ultra-wide','24mm wide','35mm','50mm','85mm portrait','135mm','200mm telephoto','macro lens','fisheye']} />
            <Sel label="Composition" value={fields.composition} onChange={set('composition')} options={['rule of thirds','centered symmetry','leading lines','negative space','dutch angle','overhead / flat lay','close-up portrait','extreme wide shot']} />
            <Sel label="Film / Sensor" value={fields.film} onChange={set('film')} options={['Kodak Portra 400','Fuji Velvia','Kodak Tri-X','Ilford HP5','digital clean','analogue grain','medium format']} />
            <Sel label="Depth of Field" value={fields.dof} onChange={set('dof')} options={['very shallow','shallow','medium','deep','infinite']} />
          </Section>
        ) : (
          <Section idx={3} title="Camera & Motion" preview={preview(['cameraMove','lens'])}>
            <Sel label="Camera Movement" value={fields.cameraMove} onChange={set('cameraMove')} options={['static','slow dolly in','dolly out','tracking shot','crane up','crane down','handheld','steadicam','orbit / arc','whip pan','time-lapse','slow motion']} />
            <Sel label="Lens" value={fields.lens} onChange={set('lens')} options={['14mm ultra-wide','24mm wide','35mm','50mm','85mm','135mm telephoto','anamorphic']} />
            <Sel label="Pacing" value={fields.pacing} onChange={set('pacing')} options={['slow & contemplative','medium','fast-paced','frenetic','rhythmic']} />
            <Sel label="Audio / Ambience" value={fields.audio} onChange={set('audio')} options={['ambient silence','city sounds','nature sounds','dramatic score','electronic score','diegetic only','no audio']} />
            <div className="field">
              <label>Duration (seconds)</label>
              <div className="slider-row">
                <input type="range" min={3} max={60} step={1} value={fields.duration || 10} onChange={e => set('duration')(Number(e.target.value))} />
                <output>{fields.duration || 10}s</output>
              </div>
            </div>
            <Sel label="FPS" value={fields.fps} onChange={set('fps')} options={['24','25','30','60','120']} />
          </Section>
        )}

        {/* STYLE */}
        <Section idx={4} title="Style & References" preview={(fields.styles||[]).concat(fields.artists||[]).join(', ') || '—'}>
          <div className="field span2">
            <label>Visual Styles</label>
            <ChipRow values={fields.styles||[]} suggestions={STYLE_SUGGESTIONS[mode]} onChange={set('styles')} />
          </div>
          <div className="field span2">
            <label>{mode === 'video' ? 'Directors / Cinematographers' : 'Photographers / Artists'}</label>
            <ChipRow values={fields.artists||[]} suggestions={ARTIST_SUGGESTIONS[mode]} onChange={set('artists')} />
          </div>
        </Section>

        {/* QUALITY */}
        <Section idx={5} title="Quality Modifiers" preview={(fields.quality||[]).join(', ') || '—'}>
          <div className="field span2">
            <label>Quality Tags</label>
            <ChipRow values={fields.quality||[]} suggestions={QUALITY_SUGGESTIONS} onChange={set('quality')} />
          </div>
        </Section>

        {/* MJ PARAMS */}
        <Section idx={6} title="Model Parameters" preview={preview(['aspectRatio','mjVersion'])}>
          <Sel label="Aspect Ratio" value={fields.aspectRatio} onChange={set('aspectRatio')} options={['16:9','9:16','4:3','3:4','1:1','2.35:1','21:9']} />
          <Sel label="MJ Version / Model" value={fields.mjVersion} onChange={set('mjVersion')} options={[{label:'MJ v7',value:'7'},{label:'MJ v6.1',value:'6.1'},{label:'MJ v6',value:'6'},{label:'MJ v5.2',value:'5.2'},{label:'Niji 6',value:'niji 6'}]} />
          <Slider label="Stylize" value={fields.stylize||100} onChange={set('stylize')} min={0} max={1000} step={10} />
          <Slider label="Chaos" value={fields.chaos||0} onChange={set('chaos')} min={0} max={100} step={5} />
          <Sel label="Style Mode" value={fields.mjStyle} onChange={set('mjStyle')} options={['raw','expressive','cute','scenic','original']} />
          <Txt label="Seed" value={fields.seed} onChange={set('seed')} placeholder="12345 (optional)" />
        </Section>

        {/* NEGATIVE */}
        <Section idx={7} title="Negative Prompt" preview={(fields.negative||[]).join(', ') || '—'}>
          <div className="field span2">
            <label>Things to avoid</label>
            <ChipRow values={fields.negative||[]} suggestions={NEGATIVE_SUGGESTIONS} onChange={set('negative')} />
          </div>
        </Section>

      </div>
    </div>
  );
}

Object.assign(window, { EditorPane });

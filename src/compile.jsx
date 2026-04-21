// compile.jsx — prompt compilation logic (no React needed, pure functions)

function compileNatural(fields, mode) {
  const f = fields;
  const parts = [];

  if (f.subject) parts.push(f.subject);
  if (f.action) parts.push(f.action);
  if (f.setting) parts.push(`set in ${f.setting}`);
  if (f.time) parts.push(`${f.time} lighting`);
  if (f.weather) parts.push(f.weather);

  const style = [...(f.styles||[]), ...(f.artists||[])].filter(Boolean);
  if (style.length) parts.push(`in the style of ${style.join(', ')}`);

  if (mode === 'video') {
    if (f.cameraMove) parts.push(`${f.cameraMove} camera movement`);
    if (f.duration) parts.push(`${f.duration}s duration`);
    if (f.pacing) parts.push(`${f.pacing} pacing`);
    if (f.audio) parts.push(`with ${f.audio} audio`);
  } else {
    if (f.lens) parts.push(`shot on ${f.lens}`);
    if (f.composition) parts.push(f.composition);
    if (f.film) parts.push(`${f.film} film`);
  }

  if (f.mood) parts.push(`${f.mood} mood`);
  if (f.quality && f.quality.length) parts.push(f.quality.join(', '));

  return parts.filter(Boolean).join(', ');
}

function compileJSON(fields, mode) {
  const f = fields;
  const obj = {};

  if (f.subject) obj.subject = f.subject;
  if (f.action) obj.action = f.action;
  if (f.setting) obj.setting = f.setting;

  const lighting = {};
  if (f.time) lighting.time_of_day = f.time;
  if (f.weather) lighting.atmosphere = f.weather;
  if (Object.keys(lighting).length) obj.lighting = lighting;

  if (mode === 'video') {
    const camera = {};
    if (f.cameraMove) camera.movement = f.cameraMove;
    if (f.lens) camera.lens = f.lens;
    if (Object.keys(camera).length) obj.camera = camera;
    if (f.duration) obj.duration_seconds = Number(f.duration) || f.duration;
    if (f.pacing) obj.pacing = f.pacing;
    if (f.audio) obj.audio = f.audio;
  } else {
    const camera = {};
    if (f.lens) camera.lens = f.lens;
    if (f.composition) camera.composition = f.composition;
    if (f.film) camera.film = f.film;
    if (Object.keys(camera).length) obj.camera = camera;
  }

  const style = {};
  if (f.styles && f.styles.length) style.references = f.styles;
  if (f.artists && f.artists.length) style.artists = f.artists;
  if (f.mood) style.mood = f.mood;
  if (Object.keys(style).length) obj.style = style;

  if (f.quality && f.quality.length) obj.quality = f.quality;

  return JSON.stringify(obj, null, 2);
}

function compileTags(fields, mode) {
  const f = fields;
  const tags = [];
  if (f.subject) tags.push(f.subject);
  if (f.action) tags.push(f.action);
  if (f.setting) tags.push(f.setting);
  if (f.time) tags.push(f.time);
  if (f.weather) tags.push(f.weather);
  if (f.mood) tags.push(`${f.mood} mood`);
  (f.styles||[]).forEach(s => tags.push(s));
  (f.artists||[]).forEach(a => tags.push(`by ${a}`));
  if (f.lens) tags.push(f.lens);
  if (f.composition) tags.push(f.composition);
  if (f.film) tags.push(f.film);
  if (f.cameraMove) tags.push(f.cameraMove);
  if (f.pacing) tags.push(`${f.pacing} pacing`);
  if (f.audio) tags.push(`${f.audio} audio`);
  (f.quality||[]).forEach(q => tags.push(q));
  return tags.filter(Boolean);
}

function compileParams(fields, mode, modelId) {
  const allModels = window.IMAGE_MODELS || [];
  const videoModels = window.VIDEO_MODELS || [];
  const modelDef = [...allModels, ...videoModels].find(m => m.id === modelId);

  const params = [];

  // MJ-specific params (v7 is default — emit --v only when overridden)
  if (modelId === 'midjourney') {
    if (fields.aspectRatio) params.push(`--ar ${fields.aspectRatio}`);
    if (fields.stylize) params.push(`--s ${fields.stylize}`);
    if (fields.chaos && fields.chaos > 0) params.push(`--c ${fields.chaos}`);
    if (fields.mjStyle) params.push(`--style ${fields.mjStyle}`);
    if (fields.mjVersion && fields.mjVersion !== '7') params.push(`--v ${fields.mjVersion}`);
    if (fields.seed) params.push(`--seed ${fields.seed}`);
  }

  // SDXL-specific
  if (modelId === 'sdxl') {
    if (fields.aspectRatio) params.push(`--ar ${fields.aspectRatio}`);
    if (fields.seed) params.push(`--seed ${fields.seed}`);
  }

  // Video model params
  if (mode === 'video') {
    if (fields.aspectRatio) params.push(`--ar ${fields.aspectRatio}`);
    if (fields.duration) params.push(`--duration ${fields.duration}`);
    if (fields.fps) params.push(`--fps ${fields.fps}`);
    if (fields.seed) params.push(`--seed ${fields.seed}`);
  }

  return params;
}

function compileNegative(fields) {
  return (fields.negative || []).join(', ');
}

window.Compile = { compileNatural, compileJSON, compileTags, compileParams, compileNegative };

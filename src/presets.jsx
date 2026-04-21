// Library of option chips for each field + starter presets.

const Options = {
  style: [
    "cinematic", "photorealistic", "editorial photograph", "documentary", "film still",
    "analog 35mm", "polaroid", "cyanotype", "oil painting", "watercolor",
    "ink wash", "concept art", "isometric 3D", "claymation", "anime cel-shading",
    "risograph", "vaporwave", "brutalist photography", "woodblock print",
  ],
  mood: [
    "serene", "melancholic", "triumphant", "mysterious", "playful",
    "ominous", "nostalgic", "euphoric", "contemplative", "uncanny",
    "tender", "kinetic", "dreamlike",
  ],
  lighting: [
    "golden hour", "blue hour", "overcast diffused", "harsh noon sun",
    "volumetric god rays", "neon rim lighting", "single-source key light",
    "rembrandt lighting", "softbox", "candlelit", "moonlit", "practical lights",
    "backlit silhouette", "chiaroscuro",
  ],
  palette: [
    "muted earth tones", "high-contrast monochrome", "pastel ice cream",
    "emerald + rust", "teal + orange", "desaturated neutrals", "sodium vapor yellow",
    "deep indigos and gold", "sepia", "kodachrome vivid",
  ],
  camera: [
    "Arri Alexa", "Sony FX6", "RED Komodo", "Hasselblad H6D", "Leica M11",
    "Canon AE-1", "Bolex 16mm", "iPhone 15 Pro", "Bolex H16",
  ],
  lens: [
    "24mm wide", "35mm", "50mm prime", "85mm portrait", "135mm telephoto",
    "anamorphic 1.33x", "tilt-shift", "macro 100mm", "fisheye 8mm",
  ],
  composition: [
    "rule of thirds", "centered symmetry", "low angle hero shot", "dutch tilt",
    "over-the-shoulder", "extreme close-up", "wide establishing shot",
    "bird's eye view", "worm's eye view", "negative space",
  ],
  cameraMove: [
    "slow dolly in", "handheld follow", "crane up", "orbit around subject",
    "locked-off tripod", "whip pan", "push in", "pull out", "gimbal glide",
    "rack focus", "tracking shot",
  ],
  timeOfDay: [
    "dawn", "sunrise", "midday", "golden hour", "dusk", "blue hour",
    "night", "pre-dawn", "overcast afternoon",
  ],
  audio: [
    "ambient room tone", "wind through leaves", "distant traffic",
    "soft piano score", "heartbeat", "no dialogue", "vinyl crackle",
    "footsteps on gravel", "ocean waves",
  ],
  negatives: [
    "blurry", "low quality", "distorted hands", "extra fingers", "watermark",
    "text", "logo", "cropped", "oversaturated", "plastic skin", "deformed",
    "lens flare", "jpeg artifacts",
  ],
};

const Aspects = {
  image: ["1:1", "3:2", "2:3", "4:5", "16:9", "21:9", "9:16"],
  video: ["16:9", "9:16", "1:1", "21:9", "4:5"],
};

const Versions = ["v7", "v6.1", "niji 6", "raw", "flux-pro", "sdxl"];

const StarterPresets = [
  {
    name: "Rain-soaked neon alley",
    mode: "image",
    spec: {
      mode: 'image',
      subject: "a lone figure in a long coat",
      action: "standing still, looking up",
      setting: "a narrow neon-drenched alley after rain",
      timeOfDay: "night",
      style: "cinematic, film still",
      mood: "melancholic",
      lighting: "neon rim lighting, practical lights, puddle reflections",
      palette: "teal + orange",
      camera: "Arri Alexa",
      lens: "35mm",
      composition: "centered symmetry, negative space above",
      details: "steam rising from grates, wet asphalt",
      cameraMove: "",
      duration: 6,
      audio: "",
      tags: ["anamorphic", "high contrast"],
      negative: ["blurry", "watermark", "text"],
      aspect: "21:9",
      quality: "high",
      stylize: 150,
      seed: "",
      version: "v7",
    },
  },
  {
    name: "Morning kitchen, slow dolly",
    mode: "video",
    spec: {
      mode: 'video',
      subject: "an elderly woman making coffee",
      action: "pouring hot water into a ceramic pot, steam curling",
      setting: "a sunlit 1970s kitchen with yellow tile",
      timeOfDay: "golden hour morning",
      style: "documentary, analog 35mm",
      mood: "tender",
      lighting: "soft backlit window light",
      palette: "muted earth tones, warm yellows",
      camera: "Sony FX6",
      lens: "50mm prime",
      composition: "over-the-shoulder",
      details: "dust motes visible in the sunbeam",
      cameraMove: "slow dolly in",
      duration: 8,
      audio: "ambient room tone, kettle whistle fading",
      tags: ["shallow depth of field"],
      negative: ["distorted hands"],
      aspect: "16:9",
      quality: "high",
      stylize: 100,
      seed: "",
      version: "v7",
    },
  },
  {
    name: "Editorial product still",
    mode: "image",
    spec: {
      mode: 'image',
      subject: "a ceramic perfume bottle",
      action: "floating above a polished stone surface",
      setting: "an empty concrete gallery",
      timeOfDay: "",
      style: "editorial photograph",
      mood: "contemplative",
      lighting: "single-source key light, hard shadow",
      palette: "desaturated neutrals with one rust accent",
      camera: "Hasselblad H6D",
      lens: "macro 100mm",
      composition: "centered symmetry, generous negative space",
      details: "crisp specular highlights, matte finish",
      cameraMove: "",
      duration: 6,
      audio: "",
      tags: ["studio", "product photography"],
      negative: ["oversaturated", "plastic skin", "text"],
      aspect: "4:5",
      quality: "high",
      stylize: 80,
      seed: "",
      version: "flux-pro",
    },
  },
];

window.Presets = { Options, Aspects, Versions, StarterPresets };

// Définitions partagées entre le jeu et l'éditeur : types de cubes, textures visuelles, lumières.
// Modifier ce fichier change les deux à la fois.

// Textures utiles (types de cubes). hp = PV d'un cube ; color = couleur repère de la vue « texture utile » de l'éditeur.
export const MATS = [
  { id: 'gel',   name: 'Gelée',    hp: 30,  color: '#4caf50', regen: true,  look: 'dark', info: 'se régénère' },
  { id: 'eye',   name: 'Œil',      hp: 15,  color: '#ffd23a', regen: true,  look: 'dark', weak: 3, info: 'point faible ×3' },
  { id: 'shell', name: 'Carapace', hp: 60,  color: '#3a7bd5', regen: false, look: 'pale', tunnel: true, info: 'un trou percé reste ouvert' },
  { id: 'core',  name: 'Noyau',    hp: 20,  color: '#ff3ad0', regen: false, look: 'dark', core: true, info: 'détruit = mort immédiate' },
  { id: 'flesh', name: 'Chair',    hp: 40,  color: '#e57373', regen: false, look: 'dark', info: '' },
  { id: 'bone',  name: 'Os',       hp: 80,  color: '#f2f2f2', regen: false, look: 'dark', info: '' },
  { id: 'fur',   name: 'Fourrure', hp: 25,  color: '#a1887f', regen: false, look: 'dark', info: '' },
  { id: 'wood',  name: 'Bois',     hp: 70,  color: '#c07a3a', regen: false, look: 'dark', info: '' },
  { id: 'stone', name: 'Pierre',   hp: 120, color: '#90a4ae', regen: false, look: 'pale', info: '' },
];

export const TEXTURES = [
  { id: 'none', name: 'Aucune' }, { id: 'grain', name: 'Grain' }, { id: 'scales', name: 'Écailles' },
  { id: 'wood', name: 'Bois' }, { id: 'stone', name: 'Pierre' }, { id: 'cracks', name: 'Fissures' },
  { id: 'dots', name: 'Points' }, { id: 'stripes', name: 'Rayures' }, { id: 'fabric', name: 'Tissu' },
];

export const LIGHTS = [
  { id: 'matte', name: 'Mat' }, { id: 'glossy', name: 'Brillant' }, { id: 'metal', name: 'Métallique' },
  { id: 'glow', name: 'Lumineux' }, { id: 'translucent', name: 'Translucide' },
];

/* ===== Motifs des textures visuelles (32 × 32, luminosité multipliée par la couleur) ===== */
export const TILE = 32;
function hashN(x, y, s) { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function smoothNoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const a = hashN(xi & 7, yi & 7, s), b = hashN((xi + 1) & 7, yi & 7, s), c = hashN(xi & 7, (yi + 1) & 7, s), d = hashN((xi + 1) & 7, (yi + 1) & 7, s);
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function texValue(id, x, y) {
  const n = hashN(x, y, 3);
  switch (id) {
    case 'none': return 1;
    case 'grain': return 0.86 + 0.14 * n;
    case 'scales': { const r = Math.floor(y / 8), ox = (r % 2) * 4, cx = ((x + ox) % 8) - 4, cy = (y % 8); const d = Math.hypot(cx, cy - 8); return d > 7 && d < 8.6 ? 0.62 : 0.92 - 0.12 * (cy / 8) + 0.04 * n; }
    case 'wood': { const v = Math.sin((y + smoothNoise(x / 8, y / 8, 5) * 6) * 0.9); return 0.8 + 0.12 * v + 0.05 * n; }
    case 'stone': { const v = smoothNoise(x / 6, y / 6, 9); return (v > 0.48 && v < 0.53) ? 0.62 : 0.78 + 0.18 * smoothNoise(x / 3, y / 3, 11) + 0.04 * n; }
    case 'cracks': { const v = Math.abs(smoothNoise(x / 7, y / 7, 13) - 0.5); return v < 0.035 ? 0.5 : 0.95 + 0.05 * n; }
    case 'dots': { const cx = (x % 8) - 3.5, cy = (y % 8) - 3.5; return cx * cx + cy * cy < 4.5 ? 0.68 : 1; }
    case 'stripes': return ((x + y) % 8) < 3 ? 0.75 : 1;
    case 'fabric': { const a = (x % 4) < 2, b = (y % 4) < 2; return (a !== b ? 0.8 : 0.96) - 0.04 * n; }
  }
  return 1;
}
export function makeAtlasCanvas() {
  const NT = TEXTURES.length, c = document.createElement('canvas'); c.width = TILE * NT; c.height = TILE;
  const g = c.getContext('2d'), img = g.createImageData(TILE * NT, TILE);
  TEXTURES.forEach((t, k) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) { const v = Math.round(255 * texValue(t.id, x, y)), o = ((y * TILE * NT) + k * TILE + x) * 4; img.data[o] = img.data[o + 1] = img.data[o + 2] = v; img.data[o + 3] = 255; } });
  g.putImageData(img, 0, 0);
  return c;
}
export function makeAtlas(THREE, canvas = makeAtlasCanvas()) {
  const t = new THREE.CanvasTexture(canvas);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false;
  return t;
}

/* ===== Matière de rendu pour une « lumière » donnée (attribut d'instance aTex = n° de motif) ===== */
export function makeVoxelMaterial(THREE, lightId, atlas) {
  const NT = TEXTURES.length;
  const m = new THREE.MeshStandardMaterial({ map: atlas, roughness: 1, metalness: 0 });
  if (lightId === 'glossy') m.roughness = 0.18;
  if (lightId === 'metal') { m.roughness = 0.3; m.metalness = 0.9; }
  if (lightId === 'translucent') { m.transparent = true; m.opacity = 0.6; m.roughness = 0.25; m.depthWrite = false; }
  m.onBeforeCompile = sh => {
    sh.vertexShader = 'attribute float aTex;\n' + sh.vertexShader.replace('#include <uv_vertex>',
      '#include <uv_vertex>\n#ifdef USE_MAP\n vMapUv = (vMapUv + vec2(aTex, 0.0)) * vec2(' + (1 / NT).toFixed(8) + ', 1.0);\n#endif');
    if (lightId === 'glow') sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * 0.95;');
  };
  m.customProgramCacheKey = () => 'vb-' + lightId;
  return m;
}

/* ===== Lecture d'un fichier de créature de l'éditeur ===== */
// Renvoie les cubes décodés avec les index des catalogues ci-dessus.
export function decodeCreature(d) {
  if (!d || d.format !== 'voxelblade-creature') throw new Error('fichier de créature invalide');
  const byId = (list, id) => Math.max(0, list.findIndex(o => o.id === id));
  const mapT = (d.textures || []).map(id => byId(TEXTURES, id)), mapM = (d.materials || []).map(id => byId(MATS, id)), mapL = (d.lights || []).map(id => byId(LIGHTS, id));
  const bin = atob(d.voxels || ''), n = Math.floor(bin.length / 10), out = [];
  for (let k = 0; k < n; k++) {
    const o = k * 10, b = j => bin.charCodeAt(o + j);
    out.push({ x: b(0), y: b(1), z: b(2), color: (b(3) << 16) | (b(4) << 8) | b(5), tex: mapT[b(6)] ?? 0, mat: mapM[b(7)] ?? 0, light: mapL[b(8)] ?? 0, part: b(9) });
  }
  return { name: d.name, size: d.size, parts: d.parts || [], animations: d.animations || {}, voxels: out };
}

/* ===== Fiche de créature (identité, déplacement, comportement, attaques, capacités) ===== */
export const RANKS = [
  { id: 'monster', name: 'Monstre' }, { id: 'passive', name: 'Créature passive' }, { id: 'npc', name: 'PNJ' },
  { id: 'boss', name: 'Boss' }, { id: 'legendary', name: 'Légendaire' },
];
export const MOVE_STYLES = [{ id: 'hop', name: 'Sautille' }, { id: 'waddle', name: 'Se dandine' }, { id: 'none', name: 'Glisse' }];
export const BEHAVIORS = [
  { id: 'approach', name: 'Va vers sa cible' }, { id: 'wander', name: 'Se promène' }, { id: 'idle', name: 'Reste à son poste' },
];
export const ATTACK_TYPES = [{ id: 'leap', name: 'Bond' }, { id: 'projectile', name: 'Projectile' }];
export function defaultAttack(type = 'leap') {
  return type === 'leap'
    ? { type: 'leap', dmg: 12, range: 1.9, windup: 0.7, cooldownMin: 2.5, cooldownMax: 4.5, duration: 0.45 }
    : { type: 'projectile', dmg: 8, range: 3.5, windup: 0.8, cooldownMin: 3.5, cooldownMax: 5.5, speed: 3.2 };
}
export function defaultSheet() {
  return {
    version: 1,
    rank: 'monster', level: 1, hp: 1000, xp: null, role: '', description: '',
    move: { speed: 1.1, style: 'waddle' },
    behavior: { mode: 'approach', keepMin: 1.0, keepMax: 1.4, aggro: 8, fleeOnHit: false },
    attacks: [],
    regen: { enabled: false, delay: 2, cubesPerSec: 20, healPerSec: 10 },
    spawn: { test: true, respawn: 3 },
  };
}
// complète une fiche incomplète avec les valeurs par défaut
export function completeSheet(s) {
  const d = defaultSheet(), out = { ...d, ...(s || {}) };
  for (const k of ['move', 'behavior', 'regen', 'spawn']) out[k] = { ...d[k], ...((s || {})[k] || {}) };
  out.attacks = ((s || {}).attacks || []).map(a => ({ ...defaultAttack(a.type), ...a }));
  return out;
}

/* ===== Animations : courbes de vitesse et évaluation d'une pose (communes à l'éditeur et au jeu) ===== */
export function bezier(x, [x1, y1, x2, y2]) { // courbe de Bézier cubique (0,0)-(x1,y1)-(x2,y2)-(1,1), comme en CSS
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = t => ((ax * t + bx) * t + cx) * t, dX = t => (3 * ax * t + 2 * bx) * t + cx, Y = t => ((ay * t + by) * t + cy) * t;
  let t = x; for (let k = 0; k < 8; k++) { const e = X(t) - x, d = dX(t); if (Math.abs(e) < 1e-5) break; if (Math.abs(d) < 1e-6) break; t -= e / d; }
  if (t < 0 || t > 1 || Math.abs(X(t) - x) > 1e-3) { let lo = 0, hi = 1; t = x; for (let k = 0; k < 30; k++) { if (X(t) < x) lo = t; else hi = t; t = (lo + hi) / 2; } }
  return Y(t);
}
export const easeVal = (ease, u) => !ease ? u : ease.preset === 'step' ? (u < 1 ? 0 : 1) : bezier(u, ease.bz || [0.65, 0, 0.35, 1]);
export const zeroPose = () => ({ rot: [0, 0, 0], pos: [0, 0, 0], scl: [1, 1, 1] });
// pose d'une pièce (rotation en degrés, position en cubes, échelle) à l'instant t d'une animation
export function evalPart(anim, k, t) {
  const keys = (anim && anim.tracks && anim.tracks[k]) || []; if (!keys.length) return zeroPose();
  if (t <= keys[0].t) return keys[0]; const last = keys[keys.length - 1]; if (t >= last.t) return last;
  let i = 0; while (keys[i + 1].t < t) i++;
  const a = keys[i], b = keys[i + 1], e = easeVal(a.ease, (t - a.t) / (b.t - a.t)), L = (u, v) => u + (v - u) * e;
  return { rot: a.rot.map((v, n) => L(v, b.rot[n])), pos: a.pos.map((v, n) => L(v, b.pos[n])), scl: a.scl.map((v, n) => L(v, b.scl[n])) };
}
export const animUsable = a => !!(a && a.tracks && Object.values(a.tracks).some(t => t && t.length));

// Voxel Blade — personnage : format du skin (image à plat façon Minecraft) et modèle 3D.
// 1 pixel = 4 cm pour un personnage de référence de 1,68 m (42 pixels) ; tout est ensuite mis à l'échelle de la vraie taille du joueur.
export const SKIN_W = 64, SKIN_H = 96, SKIN_PX = 42, SKIN_REF_H = 1.68;
export const SKIN_FORMAT = 'voxelblade-skin';

// parties : taille [largeur, hauteur, profondeur] en pixels, origine (coin bas-gauche-arrière) dans le personnage
// (personnage tourné vers +Z, pieds en y = 0, centré en x = 0 ; sa droite est en −X), position dans l'image : base et superposition
export const SKIN_PARTS = {
  head: { name: 'Tête', size: [8, 8, 8], at: [-4, 34, -4], uv: [0, 0], ov: [32, 0], inflate: 0.5 },
  body: { name: 'Torse', size: [8, 14, 4], at: [-4, 20, -2], uv: [0, 16], ov: [24, 16], inflate: 0.25 },
  armR: { name: 'Bras droit', size: [4, 14, 4], at: [-8, 20, -2], uv: [48, 16], ov: [16, 34], inflate: 0.25 },
  armL: { name: 'Bras gauche', size: [4, 14, 4], at: [4, 20, -2], uv: [0, 34], ov: [32, 34], inflate: 0.25 },
  legR: { name: 'Jambe droite', size: [4, 20, 4], at: [-4, 0, -2], uv: [48, 34], ov: [16, 58], inflate: 0.25 },
  legL: { name: 'Jambe gauche', size: [4, 20, 4], at: [0, 0, -2], uv: [0, 58], ov: [32, 58], inflate: 0.25 },
};
export const FACE_NAMES = { top: 'dessus', bottom: 'dessous', right: 'côté droit', front: 'devant', left: 'côté gauche', back: 'dos' };

// rectangles des 6 faces d'une partie dans l'image (x, y, largeur, hauteur), dépliage façon Minecraft :
// ligne 1 : [vide][dessus][dessous]   ligne 2 : [droite][devant][gauche][dos]
export function faceRects(part, overlay = false) {
  const [w, h, d] = part.size, [u, v] = overlay ? part.ov : part.uv;
  return {
    top: [u + d, v, w, d], bottom: [u + d + w, v, w, d],
    right: [u, v + d, d, h], front: [u + d, v + d, w, h], left: [u + d + w, v + d, d, h], back: [u + 2 * d + w, v + d, w, h],
  };
}
// zone totale d'une partie dans l'image
export function partRect(part, overlay = false) { const [w, h, d] = part.size, [u, v] = overlay ? part.ov : part.uv; return [u, v, 2 * (w + d), d + h]; }

// boîte texturée ; « seg » = [bas, haut] en pixels dans la hauteur de la partie (pour couper un bras en deux),
// « origin » : 'part' (coordonnées du personnage) ou 'top' (pivot en haut au centre, la boîte descend vers −Y)
export function skinBoxGeometry(THREE, part, { overlay = false, seg = null, origin = 'part', scale = 1 } = {}) {
  const [w, h, d] = part.size, R = faceRects(part, overlay), inf = overlay ? part.inflate : 0;
  const [s0, s1] = seg || [0, h];
  let x0 = part.at[0], y0 = part.at[1] + s0, z0 = part.at[2], x1 = x0 + w, y1 = part.at[1] + s1, z1 = z0 + d;
  if (origin === 'top') { const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, ty = y1; x0 -= cx; x1 -= cx; z0 -= cz; z1 -= cz; y0 -= ty; y1 -= ty; }
  x0 -= inf; y0 -= inf; z0 -= inf; x1 += inf; y1 += inf; z1 += inf;
  const sideRect = r => [r[0], r[1] + (h - s1), r[2], s1 - s0]; // partie de la face latérale correspondant au segment
  const faces = [
    { n: [0, 0, 1], r: sideRect(R.front), c: [[x0, y1, z1], [x1, y1, z1], [x0, y0, z1], [x1, y0, z1]] },
    { n: [0, 0, -1], r: sideRect(R.back), c: [[x1, y1, z0], [x0, y1, z0], [x1, y0, z0], [x0, y0, z0]] },
    { n: [-1, 0, 0], r: sideRect(R.right), c: [[x0, y1, z0], [x0, y1, z1], [x0, y0, z0], [x0, y0, z1]] },
    { n: [1, 0, 0], r: sideRect(R.left), c: [[x1, y1, z1], [x1, y1, z0], [x1, y0, z1], [x1, y0, z0]] },
    { n: [0, 1, 0], r: R.top, c: [[x0, y1, z0], [x1, y1, z0], [x0, y1, z1], [x1, y1, z1]] },
    { n: [0, -1, 0], r: R.bottom, c: [[x0, y0, z1], [x1, y0, z1], [x0, y0, z0], [x1, y0, z0]] },
  ];
  const pos = [], nor = [], uv = [], idx = [];
  for (const f of faces) {
    const [rx, ry, rw, rh] = f.r, U0 = rx / SKIN_W, U1 = (rx + rw) / SKIN_W, V0 = 1 - ry / SKIN_H, V1 = 1 - (ry + rh) / SKIN_H;
    const b = pos.length / 3;
    f.c.forEach(p => { pos.push(p[0] * scale, p[1] * scale, p[2] * scale); nor.push(...f.n); });
    uv.push(U0, V0, U1, V0, U0, V1, U1, V1);
    // sens des triangles : vers l'extérieur
    const [a, bb, c] = f.c, e1 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]], e2 = [bb[0] - a[0], bb[1] - a[1], bb[2] - a[2]];
    const cr = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    if (cr[0] * f.n[0] + cr[1] * f.n[1] + cr[2] * f.n[2] > 0) idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
    else idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

export function makeSkinTexture(THREE, canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
export function skinMaterials(THREE, tex) {
  return {
    base: new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0 }),
    over: new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0, alphaTest: 0.5, side: THREE.DoubleSide }),
  };
}
// personnage complet (aperçu, miroir, autres joueurs) : un groupe par partie, unité = 1 pixel
export function buildAvatar(THREE, tex) {
  const M = skinMaterials(THREE, tex), group = new THREE.Group(), parts = {};
  for (const [k, p] of Object.entries(SKIN_PARTS)) {
    const g = new THREE.Group(); g.name = k;
    const base = new THREE.Mesh(skinBoxGeometry(THREE, p), M.base); base.userData = { part: k, overlay: false };
    const over = new THREE.Mesh(skinBoxGeometry(THREE, p, { overlay: true }), M.over); over.userData = { part: k, overlay: true };
    g.add(base, over); group.add(g); parts[k] = { group: g, base, over };
  }
  return { group, parts, materials: M };
}

// skin par défaut : un aventurier simple
export function paintDefaultSkin(ctx) {
  ctx.clearRect(0, 0, SKIN_W, SKIN_H);
  const fill = (r, c) => { ctx.fillStyle = c; ctx.fillRect(r[0], r[1], r[2], r[3]); };
  const P = SKIN_PARTS, skin = '#e0b48f', skinD = '#c9997a', hair = '#5a3a22', tunic = '#3f6e4a', tunicD = '#335a3c', belt = '#5b3a1e', pants = '#4a4f63', boots = '#3a2a1c';
  const F = k => faceRects(P[k]);
  // tête
  const H = F('head'); Object.values(H).forEach(r => fill(r, skin));
  fill(H.top, hair); fill(H.back, hair);
  for (const k of ['right', 'left']) fill([H[k][0], H[k][1], H[k][2], 3], hair);
  fill([H.front[0], H.front[1], 8, 2], hair);
  fill([H.front[0] + 1, H.front[1] + 4, 2, 1], '#ffffff'); fill([H.front[0] + 5, H.front[1] + 4, 2, 1], '#ffffff');
  fill([H.front[0] + 2, H.front[1] + 4, 1, 1], '#2a3a6a'); fill([H.front[0] + 5, H.front[1] + 4, 1, 1], '#2a3a6a');
  fill([H.front[0] + 3, H.front[1] + 6, 2, 1], skinD);
  fill(H.bottom, skinD);
  // torse
  const B = F('body'); Object.values(B).forEach(r => fill(r, tunic));
  for (const k of ['right', 'front', 'left', 'back']) fill([B[k][0], B[k][1] + 10, B[k][2], 1], belt);
  fill([B.front[0] + 3, B.front[1], 2, 2], skin); fill(B.bottom, tunicD);
  // bras : manches puis mains
  for (const a of ['armR', 'armL']) {
    const A = F(a); Object.values(A).forEach(r => fill(r, tunic));
    for (const k of ['right', 'front', 'left', 'back']) { fill([A[k][0], A[k][1] + 7, A[k][2], 7], skin); fill([A[k][0], A[k][1] + 6, A[k][2], 1], tunicD); }
    fill(A.bottom, skinD);
  }
  // jambes : pantalon puis bottes
  for (const l of ['legR', 'legL']) {
    const L = F(l); Object.values(L).forEach(r => fill(r, pants));
    for (const k of ['right', 'front', 'left', 'back']) fill([L[k][0], L[k][1] + 14, L[k][2], 6], boots);
    fill(L.bottom, boots);
  }
}

// Objetos 3D procedurais: celular, maçã, folhas, gotas, anel de macros,
// fatia de laranja, frutas vermelhas e o ícone da marca em 3D.
import { THREE, radialTexture } from './common.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { drawIcon, iconNodes } from '../icons.js';

// ---------------------------------------------------------------------------
// Utilitários de geometria
// ---------------------------------------------------------------------------
// Cantos com curvas de Bézier que começam exatamente onde a reta termina:
// sem pontos duplicados, o chanfro do ExtrudeGeometry não cria "pontas".
export function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  const x0 = -w / 2;
  const y0 = -h / 2;
  const x1 = w / 2;
  const y1 = h / 2;
  const k = r * 0.5523; // aproximação de arco circular
  s.moveTo(0, y0);
  s.lineTo(x1 - r, y0);
  s.bezierCurveTo(x1 - r + k, y0, x1, y0 + r - k, x1, y0 + r);
  s.lineTo(x1, y1 - r);
  s.bezierCurveTo(x1, y1 - r + k, x1 - r + k, y1, x1 - r, y1);
  s.lineTo(x0 + r, y1);
  s.bezierCurveTo(x0 + r - k, y1, x0, y1 - r + k, x0, y1 - r);
  s.lineTo(x0, y0 + r);
  s.bezierCurveTo(x0, y0 + r - k, x0 + r - k, y0, x0 + r, y0);
  return s;
}

// Plano com cantos arredondados e UV de 0 a 1 (para telas e texturas).
function roundedPlane(w, h, r, segments = 16) {
  const geo = new THREE.ShapeGeometry(roundedRectShape(w, h, r), segments);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
  return geo;
}

// Remove costuras de geometrias de revolução para um sombreamento liso.
function smoothLathe(geo) {
  geo.deleteAttribute('uv');
  geo.deleteAttribute('normal');
  const merged = mergeVertices(geo, 1e-4);
  merged.computeVertexNormals();
  return merged;
}

function canvas2d(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

function toTexture(c) {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// ---------------------------------------------------------------------------
// Celular
// ---------------------------------------------------------------------------
export const PHONE = {
  W: 2.2,
  H: 4.533,
  DEPTH: 0.16,
  BEVEL: 0.045,
  BEVEL_T: 0.05,
  SCREEN_W: 2.0,
  SCREEN_H: 4.333,
  SCREEN_R: 0.29,
};

function phoneBackTexture() {
  const [c, ctx] = canvas2d(528, 1112);
  const g = ctx.createLinearGradient(0, 0, 528, 1112);
  g.addColorStop(0, '#2f6e57');
  g.addColorStop(0.55, '#1f5a48');
  g.addColorStop(1, '#143f33');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 528, 1112);
  const shine = ctx.createRadialGradient(150, 220, 0, 150, 220, 520);
  shine.addColorStop(0, 'rgba(255,255,255,.16)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = shine;
  ctx.fillRect(0, 0, 528, 1112);
  drawIcon(ctx, 'apple', 264 - 66, 520 - 66, 132, 'rgba(255,255,255,.9)', 1.5);
  ctx.fillStyle = 'rgba(255,255,255,.5)';
  ctx.font = '600 30px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('NutriAli', 264, 1010);
  return toTexture(c);
}

export function createPhone({ screen }) {
  const group = new THREE.Group();
  const { W, H, DEPTH, BEVEL, BEVEL_T, SCREEN_W, SCREEN_H, SCREEN_R } = PHONE;
  const capW = W - BEVEL * 2;
  const capH = H - BEVEL * 2;
  const front = DEPTH / 2 + BEVEL_T;

  const frameMat = new THREE.MeshPhysicalMaterial({
    color: '#3a5a4e',
    metalness: 0.9,
    roughness: 0.28,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: '#070b0a', roughness: 0.12, metalness: 0.1, clearcoat: 1 });

  const bodyGeo = new THREE.ExtrudeGeometry(roundedRectShape(capW, capH, 0.34), {
    depth: DEPTH,
    bevelEnabled: true,
    bevelThickness: BEVEL_T,
    bevelSize: BEVEL,
    bevelSegments: 6,
    curveSegments: 28,
  });
  bodyGeo.translate(0, 0, -DEPTH / 2);
  group.add(new THREE.Mesh(bodyGeo, [glassMat, frameMat]));

  // Tela (textura desenhada em canvas) + camada de reflexo do vidro
  const screenGeo = roundedPlane(SCREEN_W, SCREEN_H, SCREEN_R);
  const screenMat = new THREE.MeshBasicMaterial({ map: screen, toneMapped: false });
  const screenMesh = new THREE.Mesh(screenGeo, screenMat);
  screenMesh.position.z = front + 0.0015;
  group.add(screenMesh);

  const reflection = new THREE.Mesh(
    roundedPlane(capW - 0.02, capH - 0.02, 0.33),
    new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.06,
      metalness: 0,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      envMapIntensity: 1.4,
    })
  );
  reflection.position.z = front + 0.003;
  group.add(reflection);

  // Traseira com a marca
  const back = new THREE.Mesh(
    roundedPlane(capW, capH, 0.34),
    new THREE.MeshPhysicalMaterial({ map: phoneBackTexture(), roughness: 0.38, clearcoat: 1, clearcoatRoughness: 0.08 })
  );
  back.rotation.y = Math.PI;
  back.position.z = -front - 0.0015;
  group.add(back);

  // Módulo de câmeras
  const bumpMat = new THREE.MeshPhysicalMaterial({ color: '#284a3e', metalness: 0.5, roughness: 0.22, clearcoat: 1 });
  const bumpGeo = new THREE.ExtrudeGeometry(roundedRectShape(0.86, 0.86, 0.24), {
    depth: 0.03,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 3,
    curveSegments: 16,
  });
  const bump = new THREE.Mesh(bumpGeo, bumpMat);
  bump.position.set(0.5, 1.55, -front - 0.045);
  group.add(bump);

  const lensMat = new THREE.MeshPhysicalMaterial({ color: '#05080a', roughness: 0.04, metalness: 0.3, clearcoat: 1 });
  const lensGlass = new THREE.MeshBasicMaterial({ color: '#16233a' });
  const lensGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.06, 40);
  lensGeo.rotateX(Math.PI / 2);
  const ringGeo = new THREE.TorusGeometry(0.152, 0.02, 10, 48);
  const glassGeo = new THREE.CircleGeometry(0.075, 32);
  [
    [0.69, 1.74],
    [0.69, 1.36],
    [0.31, 1.55],
  ].forEach(([x, y]) => {
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(x, y, -front - 0.09);
    const ring = new THREE.Mesh(ringGeo, frameMat);
    ring.position.set(x, y, -front - 0.115);
    const glass = new THREE.Mesh(glassGeo, lensGlass);
    glass.rotation.y = Math.PI;
    glass.position.set(x, y, -front - 0.1205);
    group.add(lens, ring, glass);
  });
  const flash = new THREE.Mesh(
    new THREE.CircleGeometry(0.05, 24),
    new THREE.MeshBasicMaterial({ color: '#fff4d6', toneMapped: false })
  );
  flash.rotation.y = Math.PI;
  flash.position.set(0.31, 1.82, -front - 0.091);
  group.add(flash);

  // Botões laterais
  const btn = (x, y, len) => {
    const geo = new THREE.CapsuleGeometry(0.032, len, 4, 12);
    const m = new THREE.Mesh(geo, frameMat);
    m.scale.z = 0.9;
    m.position.set(x, y, 0);
    group.add(m);
  };
  btn(-W / 2 + 0.006, 1.32, 0.14);
  btn(-W / 2 + 0.006, 0.92, 0.3);
  btn(-W / 2 + 0.006, 0.5, 0.3);
  btn(W / 2 - 0.006, 0.86, 0.46);

  return {
    group,
    screenMesh,
    setScreen(tex) {
      screenMat.map = tex;
    },
  };
}

// ---------------------------------------------------------------------------
// Maçã (o símbolo da marca)
// ---------------------------------------------------------------------------
function leafTexture() {
  const [c, ctx] = canvas2d(256, 128);
  const g = ctx.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, '#2f7a4f');
  g.addColorStop(0.5, '#64b277');
  g.addColorStop(1, '#2f7a4f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = 'rgba(232,248,220,.85)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 64);
  ctx.lineTo(256, 64);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(220,244,210,.4)';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 9; i++) {
    const x = 6 + i * 28;
    ctx.beginPath();
    ctx.moveTo(x, 64);
    ctx.quadraticCurveTo(x + 14, 42, x + 36, 6);
    ctx.moveTo(x, 64);
    ctx.quadraticCurveTo(x + 14, 86, x + 36, 122);
    ctx.stroke();
  }
  return toTexture(c);
}

let sharedLeafMat = null;
function leafMaterial() {
  sharedLeafMat ??= new THREE.MeshPhysicalMaterial({
    map: leafTexture(),
    side: THREE.DoubleSide,
    roughness: 0.42,
    clearcoat: 0.4,
    clearcoatRoughness: 0.35,
    sheen: 0.5,
    sheenColor: new THREE.Color('#dfffd2'),
    sheenRoughness: 0.5,
  });
  return sharedLeafMat;
}

function leafGeometry(L = 1, W = 0.3) {
  const nu = 30;
  const nv = 10;
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let i = 0; i <= nu; i++) {
    const u = i / nu;
    const width = W * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.75)), 0.85) * (1 - 0.1 * u);
    for (let j = 0; j <= nv; j++) {
      const v = (j / nv) * 2 - 1;
      const x = u * L;
      const y = v * width;
      const z = 0.28 * L * u * u - 0.55 * Math.abs(y) * (0.6 + 0.4 * Math.sin(Math.PI * u)) + 0.05 * L * Math.sin(u * Math.PI * 2) * v;
      positions.push(x, y, z);
      uvs.push(u, (v + 1) / 2);
    }
  }
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nv; j++) {
      const a = i * (nv + 1) + j;
      const b = a + nv + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function createLeaf({ length = 1 } = {}) {
  const geo = leafGeometry(length, length * 0.3);
  geo.translate(-length / 2, 0, 0);
  return new THREE.Mesh(geo, leafMaterial());
}

export function createApple() {
  const group = new THREE.Group();
  const profile = new THREE.SplineCurve(
    [
      [0, -0.8],
      [0.1, -0.82],
      [0.22, -0.9],
      [0.42, -0.94],
      [0.66, -0.85],
      [0.86, -0.62],
      [0.99, -0.3],
      [1.05, 0.05],
      [1.03, 0.38],
      [0.93, 0.66],
      [0.74, 0.86],
      [0.5, 0.95],
      [0.3, 0.9],
      [0.16, 0.78],
      [0.06, 0.64],
      [0, 0.6],
    ].map(([x, y]) => new THREE.Vector2(x, y))
  ).getPoints(110);
  profile[0].x = 0;
  profile[profile.length - 1].x = 0;

  const geo = smoothLathe(new THREE.LatheGeometry(profile, 110));
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const deep = new THREE.Color('#2c7a4b');
  const light = new THREE.Color('#9fd06b');
  const blush = new THREE.Color('#e6d65a');
  const c = new THREE.Color();
  const { smoothstep } = THREE.MathUtils;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const ang = Math.atan2(z, x);
    const lobes = 1 + 0.028 * Math.sin(ang * 5) * smoothstep(-y, -0.2, 0.9);
    pos.setXYZ(i, x * lobes, y, z * lobes);

    c.copy(deep).lerp(light, smoothstep(y, -0.95, 0.9) * 0.85);
    c.lerp(blush, Math.max(0, Math.cos(ang - 0.9)) * smoothstep(y, -0.5, 0.6) * 0.35);
    const r = Math.hypot(x, z);
    if (y > 0.5 && r < 0.4) c.multiplyScalar(0.65 + 0.35 * (r / 0.4));
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const body = new THREE.Mesh(
    geo,
    new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      roughness: 0.34,
      clearcoat: 1,
      clearcoatRoughness: 0.16,
      sheen: 0.3,
      sheenColor: new THREE.Color('#f2ffe0'),
      sheenRoughness: 0.6,
    })
  );
  group.add(body);

  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.56, 0),
    new THREE.Vector3(0.02, 0.84, 0),
    new THREE.Vector3(0.08, 1.06, 0.02),
    new THREE.Vector3(0.16, 1.2, 0.03),
  ]);
  const stemMat = new THREE.MeshStandardMaterial({ color: '#6b4a32', roughness: 0.7 });
  group.add(new THREE.Mesh(new THREE.TubeGeometry(stemCurve, 24, 0.045, 10), stemMat));
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.046, 12, 12), stemMat);
  tip.position.copy(stemCurve.getPoint(1));
  group.add(tip);

  const leaf = createLeaf({ length: 0.85 });
  leaf.geometry.translate(0.425, 0, 0); // pivô na base da folha
  leaf.position.set(0.06, 0.96, 0.02);
  leaf.rotation.set(-0.5, -0.35, 0.55);
  group.add(leaf);

  return group;
}

// ---------------------------------------------------------------------------
// Gota d'água de vidro
// ---------------------------------------------------------------------------
let dropletGeo = null;
export function createDroplet({ color = '#9ccffb' } = {}) {
  if (!dropletGeo) {
    const pts = [];
    const N = 56;
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * Math.PI;
      pts.push(new THREE.Vector2(0.82 * Math.sin(t) * Math.cos(t / 2), -Math.cos(t)));
    }
    dropletGeo = smoothLathe(new THREE.LatheGeometry(pts, 56));
  }
  return new THREE.Mesh(
    dropletGeo,
    new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.03,
      metalness: 0,
      transparent: true,
      opacity: 0.62,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      iridescence: 0.55,
      iridescenceIOR: 1.35,
      envMapIntensity: 1.8,
      specularIntensity: 1,
      ior: 1.33,
    })
  );
}

// ---------------------------------------------------------------------------
// Anel de macronutrientes (cores do gráfico do app)
// ---------------------------------------------------------------------------
export function createMacroRing({
  radius = 0.62,
  tube = 0.15,
  parts = [
    [0.45, '#4c8466'],
    [0.3, '#8b5cf6'],
    [0.25, '#f59e0b'],
  ],
  gap = 0.2,
} = {}) {
  const group = new THREE.Group();
  const total = Math.PI * 2 - gap * parts.length;
  const capGeo = new THREE.SphereGeometry(tube, 24, 16);
  let a = Math.PI / 2;
  for (const [frac, color] of parts) {
    const arc = total * frac;
    const mat = new THREE.MeshPhysicalMaterial({ color, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.12 });
    const torus = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 24, 80, arc), mat);
    torus.rotation.z = a;
    group.add(torus);
    for (const end of [a, a + arc]) {
      const cap = new THREE.Mesh(capGeo, mat);
      cap.position.set(Math.cos(end) * radius, Math.sin(end) * radius, 0);
      group.add(cap);
    }
    a += arc + gap;
  }
  return group;
}

// ---------------------------------------------------------------------------
// Fatia de laranja
// ---------------------------------------------------------------------------
function citrusTexture() {
  const s = 512;
  const [c, ctx] = canvas2d(s, s);
  const cx = s / 2;
  const disc = (r, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cx, r, 0, Math.PI * 2);
    ctx.fill();
  };
  disc(256, '#f97316');
  disc(244, '#fb923c');
  disc(232, '#fff3df');
  const n = 10;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2 + 0.05;
    const a1 = ((i + 1) / n) * Math.PI * 2 - 0.05;
    const mid = (a0 + a1) / 2;
    const g = ctx.createRadialGradient(cx, cx, 24, cx, cx, 220);
    g.addColorStop(0, '#ffe3bd');
    g.addColorStop(0.55, '#fdba74');
    g.addColorStop(1, '#fb8c3c');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(mid) * 28, cx + Math.sin(mid) * 28);
    ctx.arc(cx, cx, 216, a0, a1);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,.28)';
  for (let k = 0; k < 220; k++) {
    const a = Math.random() * Math.PI * 2;
    const r = 40 + Math.random() * 165;
    ctx.beginPath();
    ctx.ellipse(cx + Math.cos(a) * r, cx + Math.sin(a) * r, 2 + Math.random() * 3, 6 + Math.random() * 6, a, 0, Math.PI * 2);
    ctx.fill();
  }
  disc(22, '#fff3df');
  return toTexture(c);
}

export function createCitrus({ radius = 0.6, thickness = 0.14 } = {}) {
  const peel = new THREE.MeshPhysicalMaterial({ color: '#f59e0b', roughness: 0.5, clearcoat: 0.5 });
  const face = new THREE.MeshPhysicalMaterial({ map: citrusTexture(), roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.15 });
  return new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, thickness, 72, 1), [peel, face, face]);
}

// ---------------------------------------------------------------------------
// Mirtilos
// ---------------------------------------------------------------------------
export function createBerries() {
  const group = new THREE.Group();
  const mat = new THREE.MeshPhysicalMaterial({
    color: '#4c2a9e',
    roughness: 0.38,
    clearcoat: 0.7,
    clearcoatRoughness: 0.3,
    sheen: 0.9,
    sheenColor: new THREE.Color('#c9b8ff'),
    sheenRoughness: 0.45,
  });
  const geo = new THREE.SphereGeometry(0.2, 32, 24);
  [
    [0, 0, 0],
    [0.33, 0.08, -0.12],
    [0.14, 0.3, 0.06],
  ].forEach(([x, y, z], i) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.scale.setScalar(1 - i * 0.08);
    group.add(m);
  });
  return group;
}

// ---------------------------------------------------------------------------
// Brilho suave atrás dos objetos
// ---------------------------------------------------------------------------
export function createGlow(color = '255,255,255', scale = 6, opacity = 0.9) {
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: radialTexture([
        [0, `rgba(${color},1)`],
        [0.35, `rgba(${color},.45)`],
        [1, `rgba(${color},0)`],
      ]),
      transparent: true,
      depthWrite: false,
      opacity,
    })
  );
  sprite.scale.setScalar(scale);
  return sprite;
}

// ---------------------------------------------------------------------------
// Ícone do app em 3D: bloco verde com a maçã em traço branco
// ---------------------------------------------------------------------------
class PolylineCurve3 extends THREE.Curve {
  constructor(points, closed) {
    super();
    this.points = closed ? [...points, points[0]] : points;
    this.lengths = [0];
    for (let i = 1; i < this.points.length; i++) {
      this.lengths.push(this.lengths[i - 1] + this.points[i].distanceTo(this.points[i - 1]));
    }
    this.total = this.lengths[this.lengths.length - 1];
  }

  getPoint(t, target = new THREE.Vector3()) {
    const d = t * this.total;
    let lo = 0;
    let hi = this.lengths.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (this.lengths[mid] < d) lo = mid;
      else hi = mid;
    }
    const seg = this.lengths[hi] - this.lengths[lo] || 1;
    return target.copy(this.points[lo]).lerp(this.points[hi], (d - this.lengths[lo]) / seg);
  }
}

export function createLogoTile() {
  const group = new THREE.Group();
  const size = 2.6;
  const depth = 0.32;
  const bevel = 0.14;
  const tileGeo = new THREE.ExtrudeGeometry(roundedRectShape(size, size, 0.6), {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 10,
    curveSegments: 36,
  });
  tileGeo.translate(0, 0, -depth / 2);
  const tileMat = new THREE.MeshPhysicalMaterial({
    color: '#4c8466',
    roughness: 0.3,
    metalness: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    sheen: 0.3,
    sheenColor: new THREE.Color('#c8f7df'),
  });
  group.add(new THREE.Mesh(tileGeo, tileMat));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${iconNodes('apple')
    .map(([, a]) => `<path d="${a.d}"/>`)
    .join('')}</svg>`;
  const data = new SVGLoader().parse(svg);
  const s = 0.082;
  const radius = 1.08 * s;
  const front = depth / 2 + bevel;
  const iconMat = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.06 });
  const capGeo = new THREE.SphereGeometry(radius, 20, 16);

  for (const path of data.paths) {
    for (const sub of path.subPaths) {
      const raw = sub.getPoints(28);
      const pts = [];
      raw.forEach((p) => {
        const v = new THREE.Vector3((p.x - 12) * s, -(p.y - 11.6) * s, 0);
        if (!pts.length || pts[pts.length - 1].distanceTo(v) > 1e-4) pts.push(v);
      });
      const closed = sub.autoClose || pts[0].distanceTo(pts[pts.length - 1]) < 1e-3;
      if (closed && pts[0].distanceTo(pts[pts.length - 1]) < 1e-3) pts.pop();
      const curve = new PolylineCurve3(pts, closed);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, pts.length * 4, radius, 18, closed), iconMat);
      tube.position.z = front + radius * 0.35;
      group.add(tube);
      if (!closed) {
        for (const end of [pts[0], pts[pts.length - 1]]) {
          const cap = new THREE.Mesh(capGeo, iconMat);
          cap.position.copy(end);
          cap.position.z = front + radius * 0.35;
          group.add(cap);
        }
      }
    }
  }
  return group;
}

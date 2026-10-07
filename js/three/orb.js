// Esfera de voz do Ali: superfície orgânica que pulsa quando ele ouve e fala.
import { THREE, createRenderer, fitToCanvas, visibleLoop, pointer, damp, radialTexture, reduceMotion } from './common.js';

// Simplex noise 3D — Ashima Arts / Stefan Gustavson (licença MIT)
const NOISE = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uAmp;
uniform float uFreq;
varying vec3 vNormal;
varying vec3 vView;
varying float vDisp;
${NOISE}
float field(vec3 p) {
  return snoise(p * uFreq + vec3(0.0, uTime * 0.45, uTime * 0.15)) * 0.88
       + snoise(p * uFreq * 1.7 + vec3(uTime * 0.3, -uTime * 0.25, 0.0)) * 0.12;
}
void main() {
  vec3 n = normalize(position);
  vec3 tangent = normalize(cross(n, abs(n.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
  vec3 bitangent = normalize(cross(n, tangent));
  float eps = 0.012;
  float d0 = field(n);
  vec3 n1 = normalize(n + tangent * eps);
  vec3 n2 = normalize(n + bitangent * eps);
  vec3 p0 = n * (1.0 + d0 * uAmp);
  vec3 p1 = n1 * (1.0 + field(n1) * uAmp);
  vec3 p2 = n2 * (1.0 + field(n2) * uAmp);
  vec3 dn = normalize(cross(p1 - p0, p2 - p0));
  if (dot(dn, n) < 0.0) dn = -dn;
  vDisp = d0;
  vNormal = normalize(normalMatrix * dn);
  vec4 mv = modelViewMatrix * vec4(p0, 1.0);
  vView = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uDeep;
uniform vec3 uMid;
uniform vec3 uGlow;
uniform vec3 uListen;
uniform float uEnergy;
uniform float uListenMix;
varying vec3 vNormal;
varying vec3 vView;
varying float vDisp;
void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vView);
  float ndv = clamp(dot(N, V), 0.0, 1.0);
  float fres = pow(1.0 - ndv, 2.4);
  vec3 L = normalize(vec3(-0.5, 0.8, 0.6));
  float diff = clamp(dot(N, L), 0.0, 1.0);
  vec3 H = normalize(L + V);
  float spec = pow(clamp(dot(N, H), 0.0, 1.0), 60.0);
  vec3 glow = mix(uGlow, uListen, uListenMix);
  vec3 base = mix(uDeep, uMid, diff * 0.75 + 0.25);
  base = mix(base, glow, smoothstep(-0.2, 0.9, vDisp) * (0.25 + uEnergy * 0.45));
  vec3 col = base + spec * 0.5 + fres * glow * (0.8 + uEnergy * 0.9);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;

const MODES = {
  idle: { amp: 0.07, freq: 0.75, energy: 0.1, listen: 0, spin: 0.12 },
  listening: { amp: 0.1, freq: 0.95, energy: 0.35, listen: 1, spin: 0.2 },
  thinking: { amp: 0.05, freq: 1.25, energy: 0.25, listen: 0.35, spin: 0.9 },
  speaking: { amp: 0.12, freq: 0.85, energy: 0.65, listen: 0, spin: 0.28 },
};

export function initOrb(canvas) {
  const renderer = createRenderer(canvas, { maxDpr: 2 });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.set(0, 0, 6.4);
  fitToCanvas(renderer, camera, canvas);

  const uniforms = {
    uTime: { value: 0 },
    uAmp: { value: MODES.idle.amp },
    uFreq: { value: MODES.idle.freq },
    uEnergy: { value: 0.1 },
    uListenMix: { value: 0 },
    uDeep: { value: new THREE.Color('#0d3a2c') },
    uMid: { value: new THREE.Color('#4c8466') },
    uGlow: { value: new THREE.Color('#9ff0c8') },
    uListen: { value: new THREE.Color('#a5c8ff') },
  };

  const group = new THREE.Group();
  scene.add(group);

  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: radialTexture([
        [0, 'rgba(159,240,200,.55)'],
        [0.35, 'rgba(110,200,160,.2)'],
        [1, 'rgba(110,200,160,0)'],
      ]),
      transparent: true,
      depthWrite: false,
    })
  );
  halo.scale.setScalar(5.2);
  halo.position.z = -1.2;
  scene.add(halo);

  const orb = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1, window.innerWidth < 700 ? 28 : 40),
    new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader })
  );
  group.add(orb);

  // Órbitas finas
  const ringMat = new THREE.MeshBasicMaterial({ color: '#9ff0c8', transparent: true, opacity: 0.28, depthWrite: false });
  const rings = [
    [1.2, 0, 0.3],
    [-0.9, 0.5, 0],
    [0.3, 1.1, -0.4],
  ].map(([x, y, z], i) => {
    const r = new THREE.Mesh(new THREE.TorusGeometry(1.55 + i * 0.12, 0.0065, 6, 220), ringMat);
    r.rotation.set(x, y, z);
    group.add(r);
    return r;
  });

  // Partículas
  const count = 650;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 1.85 + Math.random() * 1.4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({
      size: 0.045,
      map: radialTexture([
        [0, 'rgba(255,255,255,1)'],
        [1, 'rgba(255,255,255,0)'],
      ], 64),
      color: '#b7f5d8',
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      sizeAttenuation: true,
    })
  );
  scene.add(dust);

  // Ondas sonoras que se expandem quando o Ali fala
  const waveGeo = new THREE.RingGeometry(0.985, 1, 128);
  const waves = Array.from({ length: 5 }, () => {
    const m = new THREE.Mesh(
      waveGeo,
      new THREE.MeshBasicMaterial({ color: '#9ff0c8', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })
    );
    m.visible = false;
    scene.add(m);
    return { mesh: m, age: 0, active: false };
  });

  let mode = 'idle';
  let elapsed = 0;
  let waveTimer = 0;
  let px = 0;
  let py = 0;
  let speakEnv = 0;

  visibleLoop(canvas, (dt) => {
    elapsed += dt;
    const t = elapsed;
    const target = MODES[mode];
    px = damp(px, pointer.x, 2.5, dt);
    py = damp(py, pointer.y, 2.5, dt);

    let ampTarget = target.amp;
    if (mode === 'speaking') {
      const syllables = Math.abs(Math.sin(t * 7.3)) * (0.55 + 0.45 * Math.sin(t * 2.1)) + 0.25 * Math.abs(Math.sin(t * 17.0));
      speakEnv = damp(speakEnv, syllables, 12, dt);
      ampTarget = 0.09 + 0.16 * speakEnv;
    } else if (mode === 'listening') {
      ampTarget = target.amp + 0.035 * Math.abs(Math.sin(t * 5.2));
    }
    const motion = reduceMotion ? 0.25 : 1;
    uniforms.uAmp.value = damp(uniforms.uAmp.value, ampTarget * motion, 8, dt);
    uniforms.uFreq.value = damp(uniforms.uFreq.value, target.freq, 3, dt);
    uniforms.uEnergy.value = damp(uniforms.uEnergy.value, target.energy, 4, dt);
    uniforms.uListenMix.value = damp(uniforms.uListenMix.value, target.listen, 4, dt);
    uniforms.uTime.value += dt * (reduceMotion ? 0.2 : 1) * (1 + uniforms.uEnergy.value * 0.8);

    group.rotation.y += dt * target.spin * motion;
    group.rotation.x = damp(group.rotation.x, -py * 0.3, 3, dt);
    group.rotation.z = damp(group.rotation.z, px * 0.15, 3, dt);
    rings.forEach((r, i) => (r.rotation.z += dt * (0.15 + i * 0.07) * motion));
    dust.rotation.y -= dt * 0.04 * motion;
    halo.material.opacity = 0.55 + uniforms.uEnergy.value * 0.5;
    halo.scale.setScalar(5 + uniforms.uAmp.value * 4);

    if (mode === 'speaking' && !reduceMotion) {
      waveTimer -= dt;
      if (waveTimer <= 0) {
        waveTimer = 0.45;
        const free = waves.find((w) => !w.active);
        if (free) {
          free.active = true;
          free.age = 0;
          free.mesh.visible = true;
        }
      }
    }
    waves.forEach((w) => {
      if (!w.active) return;
      w.age += dt;
      const p = w.age / 1.7;
      w.mesh.scale.setScalar(1.12 + p * 1.25);
      w.mesh.material.opacity = 0.4 * (1 - p);
      if (p >= 1) {
        w.active = false;
        w.mesh.visible = false;
      }
    });

    renderer.render(scene, camera);
  });

  return {
    setMode(next) {
      if (MODES[next]) mode = next;
    },
  };
}

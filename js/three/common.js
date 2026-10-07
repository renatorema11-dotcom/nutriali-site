// Utilitários compartilhados pelas cenas 3D (Three.js).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export { THREE };

export const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createRenderer(canvas, { maxDpr = 2 } = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  return renderer;
}

// Iluminação de estúdio sem baixar HDRs.
export function studioEnvironment(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  return env;
}

export function addStudioLights(scene) {
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(4, 6, 7);
  const fill = new THREE.DirectionalLight(0xfff3dc, 0.6);
  fill.position.set(-6, 1, 4);
  const rim = new THREE.DirectionalLight(0xd8fff0, 0.9);
  rim.position.set(-2, 4, -6);
  scene.add(key, fill, rim, new THREE.AmbientLight(0xffffff, 0.25));
}

// Mantém renderer e câmera do tamanho do canvas no CSS.
export function fitToCanvas(renderer, camera, canvas, onResize) {
  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    onResize?.(w, h);
  };
  new ResizeObserver(resize).observe(canvas);
  resize();
  return resize;
}

// Laço de renderização que só roda com o canvas visível e a aba ativa.
export function visibleLoop(canvas, frame) {
  let raf = 0;
  let last = 0;
  let visible = false;
  const tick = (now) => {
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;
    frame(dt, now / 1000);
    raf = requestAnimationFrame(tick);
  };
  const start = () => {
    if (raf || !visible || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };
  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      visible ? start() : stop();
    },
    { rootMargin: '120px 0px' }
  ).observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  return { start, stop };
}

// Posição do mouse normalizada (-1..1) na janela.
export const pointer = { x: 0, y: 0 };
window.addEventListener(
  'pointermove',
  (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
  },
  { passive: true }
);

export const damp = THREE.MathUtils.damp;
export const clamp = THREE.MathUtils.clamp;
export const easeOutBack = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
export const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// Textura de brilho radial (para halos e sombras suaves).
export function radialTexture(stops, size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([offset, color]) => g.addColorStop(offset, color));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Tamanho visível (em unidades do mundo) no plano z = 0.
export function viewSizeAtOrigin(camera) {
  const h = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
  return { width: h * camera.aspect, height: h };
}

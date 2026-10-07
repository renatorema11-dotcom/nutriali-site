// Cena do topo: celular com o app do paciente cercado por alimentos 3D.
import {
  THREE,
  createRenderer,
  studioEnvironment,
  addStudioLights,
  fitToCanvas,
  visibleLoop,
  pointer,
  damp,
  clamp,
  easeOutBack,
  easeOutExpo,
  reduceMotion,
  viewSizeAtOrigin,
} from './common.js';
import {
  createPhone,
  createApple,
  createLeaf,
  createDroplet,
  createMacroRing,
  createCitrus,
  createBerries,
  createGlow,
} from './objects.js';
import { createScreenTextures } from './screens.js';

// Tamanho da composição (celular + objetos) em unidades do mundo.
const COMPOSITION = { w: 5.7, h: 6.1 };

const ITEMS = [
  { make: createApple, pos: [-1.9, -1.8, 0.95], scale: 0.68, rot: [0.2, 0.6, -0.15], spin: [0, 0.3, 0], float: 0.1, speed: 1.1, spread: [-1.2, -0.8, 0.5] },
  { make: () => createMacroRing(), pos: [1.78, 1.6, -0.5], scale: 0.82, rot: [0.45, -0.55, 0.2], spin: [0, 0, 0.35], float: 0.09, speed: 0.9, spread: [1, 1, 0] },
  { make: () => createCitrus(), pos: [-2.05, 1.98, -0.6], scale: 0.7, rot: [1.15, 0.25, 0.35], spin: [0.12, 0.2, 0], float: 0.12, speed: 0.8, spread: [-1, 1, 0] },
  { make: () => createDroplet(), pos: [1.85, -0.45, 0.9], scale: 0.3, rot: [0, 0, -0.25], spin: [0, 0.6, 0], float: 0.14, speed: 1.3, spread: [1.3, 0, 0.4] },
  { make: () => createDroplet(), pos: [1.05, -2.3, 1.5], scale: 0.2, rot: [0, 0, 0.3], spin: [0, -0.5, 0], float: 0.1, speed: 1.6, spread: [0.6, -1, 0.5] },
  { make: () => createBerries(), pos: [1.9, -1.8, 0.4], scale: 0.85, rot: [0.3, 0.2, 0], spin: [0, 0.25, 0.1], float: 0.08, speed: 1, spread: [1, -0.8, 0] },
  { make: () => createLeaf(), pos: [-0.7, 2.7, -1.2], scale: 0.9, rot: [0.6, 0.2, 0.5], spin: [0.15, 0.3, 0.1], float: 0.12, speed: 0.7, spread: [-0.4, 1.2, 0] },
  { make: () => createLeaf(), pos: [2.6, 0.55, -1.3], scale: 0.75, rot: [-0.4, 0.8, -0.9], spin: [0.2, 0.1, 0.2], float: 0.1, speed: 0.95, spread: [1.3, 0.3, 0] },
  { make: () => createLeaf(), pos: [-2.5, 0.15, 0.3], scale: 0.7, rot: [0.3, -0.6, 2.4], spin: [0.1, 0.25, 0.15], float: 0.13, speed: 1.2, spread: [-1.3, 0, 0] },
];

// Pontos (no espaço do celular) onde os cartões HTML ficam presos.
const CHIP_ANCHORS = [
  [-1.25, 1.12, 0.4],
  [1.3, 0.12, 0.4],
  [-1.3, -0.3, 0.5],
];

export async function initHero({ canvas, stage, section, chips }) {
  const renderer = createRenderer(canvas, { maxDpr: 1.75 });
  const scene = new THREE.Scene();
  scene.environment = studioEnvironment(renderer);
  addStudioLights(scene);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 16);

  const screens = await createScreenTextures(renderer);

  const rig = new THREE.Group();
  const tilt = new THREE.Group();
  rig.add(tilt);
  scene.add(rig);

  const glow = createGlow('214,244,229', 8.5, 0.85);
  glow.position.set(0, 0, -2.5);
  tilt.add(glow);

  const phone = createPhone({ screen: screens.home });
  phone.group.rotation.set(0.05, -0.38, 0.03);
  const holder = new THREE.Group();
  holder.add(phone.group);
  tilt.add(holder);

  const items = ITEMS.map((def, i) => {
    const mesh = def.make();
    mesh.rotation.set(...def.rot);
    mesh.scale.setScalar(0.0001);
    tilt.add(mesh);
    return {
      ...def,
      mesh,
      base: new THREE.Vector3(...def.pos),
      spread: new THREE.Vector3(...def.spread),
      phase: i * 1.7,
    };
  });

  const anchors = CHIP_ANCHORS.map((p) => {
    const o = new THREE.Object3D();
    o.position.set(...p);
    holder.add(o);
    return o;
  });

  // Encaixa a composição no espaço reservado (#hero-stage) do layout.
  // Em telas estreitas os objetos se aproximam do celular para caber.
  let w = 1;
  let h = 1;
  let spreadX = 1;
  const layout = () => {
    const cr = canvas.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    w = cr.width;
    h = cr.height;
    if (!w || !h) return;
    const unit = viewSizeAtOrigin(camera).height / h;
    spreadX = clamp((sr.width / sr.height - 0.55) / 0.35, 0, 1) * 0.3 + 0.7;
    const compW = COMPOSITION.w * spreadX;
    rig.position.set((sr.left + sr.width / 2 - cr.left - w / 2) * unit, -(sr.top + sr.height / 2 - cr.top - h / 2) * unit, 0);
    rig.scale.setScalar(Math.min((sr.width * unit) / compW, (sr.height * unit) / COMPOSITION.h));
    anchors.forEach((a, i) => (a.position.x = CHIP_ANCHORS[i][0] * (0.55 + 0.45 * spreadX)));
  };
  fitToCanvas(renderer, camera, canvas, layout);
  new ResizeObserver(layout).observe(stage);
  document.fonts?.ready.then(layout);

  const v = new THREE.Vector3();
  let elapsed = 0;
  let introStart = null;
  let px = 0;
  let py = 0;
  let chipsShown = false;

  // A entrada usa o tempo real (dura o mesmo em qualquer aparelho);
  // as flutuações usam o tempo acumulado dos quadros.
  const frame = (dt, now) => {
    elapsed += dt;
    if (now !== undefined) introStart ??= now;
    const since = introStart === null ? 0 : now - introStart;
    const t = reduceMotion ? 0 : elapsed;
    px = damp(px, pointer.x, 3, dt);
    py = damp(py, pointer.y, 3, dt);
    const scrollP = clamp(window.scrollY / Math.max(section.offsetHeight, 1), 0, 1);

    const intro = reduceMotion ? 1 : easeOutExpo(clamp(since / 1.8, 0, 1));
    holder.position.y = (1 - intro) * -3.4 + Math.sin(t * 0.9) * 0.07 - scrollP * 0.6;
    holder.rotation.y = (1 - intro) * -1.1 + Math.sin(t * 0.45) * 0.08 + scrollP * 0.9;
    holder.rotation.x = Math.cos(t * 0.6) * 0.025 + scrollP * 0.15;

    tilt.rotation.y = px * 0.24;
    tilt.rotation.x = -py * 0.12;

    items.forEach((it, i) => {
      const p = reduceMotion ? 1 : clamp((since - 0.45 - i * 0.08) / 0.9, 0, 1);
      it.mesh.scale.setScalar(Math.max(it.scale * (p > 0 ? easeOutBack(p) : 0), 0.0001));
      it.mesh.position.copy(it.base).addScaledVector(it.spread, scrollP * 2.4);
      it.mesh.position.x *= spreadX;
      it.mesh.position.y += Math.sin(t * it.speed + it.phase) * it.float;
      if (!reduceMotion) {
        it.mesh.rotation.x += it.spin[0] * dt;
        it.mesh.rotation.y += it.spin[1] * dt;
        it.mesh.rotation.z += it.spin[2] * dt;
      }
    });

    renderer.render(scene, camera);

    if (!chipsShown && since > 1.5) {
      chipsShown = true;
      chips.forEach((c, i) => setTimeout(() => c.classList.add('is-visible'), i * 220));
    }
    anchors.forEach((a, i) => {
      if (!chips[i]) return;
      a.getWorldPosition(v).project(camera);
      const x = (v.x * 0.5 + 0.5) * w;
      const y = (-v.y * 0.5 + 0.5) * h;
      chips[i].style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
    });
  };

  visibleLoop(canvas, frame);
  frame(0);
  return { phone, screens };
}

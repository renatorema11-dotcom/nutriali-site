// Tour do app do paciente: o celular gira e troca de tela a cada passo,
// com alimentos 3D relacionados a cada funcionalidade.
import {
  THREE,
  createRenderer,
  studioEnvironment,
  addStudioLights,
  fitToCanvas,
  visibleLoop,
  pointer,
  damp,
  easeOutBack,
  easeInOutCubic,
  reduceMotion,
  viewSizeAtOrigin,
} from './common.js';
import { createPhone, createApple, createLeaf, createDroplet, createMacroRing, createCitrus, createBerries, createGlow } from './objects.js';
import { createScreenTextures, SCREEN_ORDER } from './screens.js';

const COMPOSITION = { w: 5.4, h: 5.9 };

// Objetos que acompanham cada passo (painel, diário, hábitos, evolução)
const SETS = [
  [
    { make: createApple, pos: [-1.65, -1.55, 0.9], scale: 0.62, rot: [0.2, 0.5, -0.1], spin: [0, 0.35, 0] },
    { make: () => createLeaf(), pos: [1.7, 1.65, -0.5], scale: 0.85, rot: [0.5, 0.3, -0.6], spin: [0.2, 0.25, 0.1] },
  ],
  [
    { make: () => createCitrus(), pos: [1.7, 1.45, -0.4], scale: 0.62, rot: [1.2, 0.3, 0.3], spin: [0.15, 0.25, 0] },
    { make: () => createBerries(), pos: [-1.7, -1.7, 0.6], scale: 0.9, rot: [0.3, 0.2, 0], spin: [0, 0.3, 0.1] },
  ],
  [
    { make: () => createDroplet(), pos: [-1.7, 1.15, 0.5], scale: 0.32, rot: [0, 0, 0.2], spin: [0, 0.6, 0] },
    { make: () => createDroplet(), pos: [1.65, -0.95, 0.8], scale: 0.25, rot: [0, 0, -0.3], spin: [0, -0.5, 0] },
    { make: () => createDroplet(), pos: [1.4, 1.85, -0.6], scale: 0.18, rot: [0, 0, 0.1], spin: [0, 0.4, 0] },
  ],
  [
    { make: () => createMacroRing(), pos: [1.7, 1.45, -0.3], scale: 0.72, rot: [0.4, -0.5, 0.2], spin: [0, 0, 0.4] },
    { make: () => createLeaf(), pos: [-1.8, -1.35, 0.4], scale: 0.8, rot: [0.3, -0.6, 2.4], spin: [0.1, 0.25, 0.15] },
  ],
];

export async function initTour(canvas) {
  const renderer = createRenderer(canvas, { maxDpr: 2 });
  const scene = new THREE.Scene();
  scene.environment = studioEnvironment(renderer);
  addStudioLights(scene);

  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
  camera.position.set(0, 0, 16);

  const screens = await createScreenTextures(renderer);

  const rig = new THREE.Group();
  scene.add(rig);
  const glow = createGlow('214,244,229', 8, 0.8);
  glow.position.z = -2.2;
  rig.add(glow);

  const phone = createPhone({ screen: screens.home });
  const holder = new THREE.Group();
  holder.add(phone.group);
  rig.add(holder);

  const sets = SETS.map((defs) =>
    defs.map((def, i) => {
      const mesh = def.make();
      mesh.rotation.set(...def.rot);
      mesh.scale.setScalar(0.0001);
      mesh.visible = false;
      rig.add(mesh);
      return { ...def, mesh, base: new THREE.Vector3(...def.pos), vis: 0, phase: i * 2.1 };
    })
  );

  fitToCanvas(renderer, camera, canvas, () => {
    const view = viewSizeAtOrigin(camera);
    rig.scale.setScalar(Math.min(view.width / COMPOSITION.w, view.height / COMPOSITION.h));
  });

  let target = 0;
  let shown = 0;
  let spin = null;
  let pending = null;
  let elapsed = 0;
  let px = 0;
  let py = 0;

  const startSpin = (next) => {
    const dir = next > shown ? 1 : -1;
    spin = { t: 0, dir, next, swapped: false };
  };

  visibleLoop(canvas, (dt) => {
    elapsed += dt;
    const t = reduceMotion ? 0 : elapsed;
    px = damp(px, pointer.x, 3, dt);
    py = damp(py, pointer.y, 3, dt);

    let spinAngle = 0;
    if (spin) {
      spin.t = Math.min(spin.t + dt / 1.15, 1);
      const e = easeInOutCubic(spin.t);
      spinAngle = e * Math.PI * 2 * spin.dir;
      if (!spin.swapped && e >= 0.5) {
        phone.setScreen(screens[SCREEN_ORDER[spin.next]]);
        shown = spin.next;
        spin.swapped = true;
      }
      if (spin.t >= 1) {
        spin = null;
        spinAngle = 0;
        if (pending !== null && pending !== shown) startSpin(pending);
        pending = null;
      }
    }

    holder.rotation.y = -0.24 + Math.sin(t * 0.5) * 0.08 + px * 0.25 + spinAngle;
    holder.rotation.x = 0.04 + Math.cos(t * 0.4) * 0.03 - py * 0.1;
    holder.position.y = Math.sin(t * 0.8) * 0.06;

    sets.forEach((set, si) =>
      set.forEach((it) => {
        it.vis = damp(it.vis, si === target ? 1 : 0, 4.5, dt);
        it.mesh.visible = it.vis > 0.01;
        if (!it.mesh.visible) return;
        it.mesh.scale.setScalar(Math.max(it.scale * easeOutBack(it.vis), 0.0001));
        it.mesh.position.copy(it.base).multiplyScalar(0.75 + 0.25 * it.vis);
        it.mesh.position.y += Math.sin(t * 1.1 + it.phase) * 0.1;
        if (!reduceMotion) {
          it.mesh.rotation.x += it.spin[0] * dt;
          it.mesh.rotation.y += it.spin[1] * dt;
          it.mesh.rotation.z += it.spin[2] * dt;
        }
      })
    );

    renderer.render(scene, camera);
  });

  return {
    setStep(i, immediate = false) {
      if (i === target && !immediate) return;
      target = i;
      if (immediate || reduceMotion) {
        phone.setScreen(screens[SCREEN_ORDER[i]]);
        shown = i;
        spin = null;
        return;
      }
      if (!spin) {
        if (i !== shown) startSpin(i);
      } else if (!spin.swapped) {
        spin.next = i;
      } else {
        pending = i;
      }
    },
  };
}

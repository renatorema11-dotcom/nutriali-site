// Seção "A empresa": o ícone do NutriAli em 3D com alimentos orbitando.
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
  radialTexture,
  reduceMotion,
  viewSizeAtOrigin,
} from './common.js';
import { createLogoTile, createLeaf, createDroplet, createBerries, createCitrus, createGlow } from './objects.js';

const ORBITERS = [
  { make: () => createLeaf(), radius: 2.35, angle: 0.3, y: 0.9, scale: 0.75, speed: 0.22 },
  { make: () => createDroplet(), radius: 2.2, angle: 1.9, y: -0.6, scale: 0.26, speed: 0.22 },
  { make: () => createBerries(), radius: 2.3, angle: 3.3, y: 0.4, scale: 0.75, speed: 0.22 },
  { make: () => createCitrus(), radius: 2.4, angle: 4.6, y: -1.0, scale: 0.5, speed: 0.22 },
  { make: () => createLeaf(), radius: 2.1, angle: 5.6, y: 1.4, scale: 0.6, speed: 0.22 },
];

export function initBrand(canvas) {
  const renderer = createRenderer(canvas, { maxDpr: 2 });
  const scene = new THREE.Scene();
  scene.environment = studioEnvironment(renderer);
  addStudioLights(scene);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0.4, 11);
  camera.lookAt(0, 0, 0);

  const rig = new THREE.Group();
  scene.add(rig);

  const glow = createGlow('255,255,255', 7.5, 0.9);
  glow.position.z = -2.5;
  rig.add(glow);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      map: radialTexture([
        [0, 'rgba(16,48,38,.32)'],
        [1, 'rgba(16,48,38,0)'],
      ]),
      transparent: true,
      depthWrite: false,
    })
  );
  shadow.scale.set(3.6, 0.7, 1);
  shadow.position.set(0, -2.05, -0.6);
  rig.add(shadow);

  const logo = createLogoTile();
  rig.add(logo);

  const orbiters = ORBITERS.map((def, i) => {
    const mesh = def.make();
    mesh.scale.setScalar(def.scale);
    mesh.rotation.set(i * 0.7, i * 1.3, i * 0.4);
    rig.add(mesh);
    return { ...def, mesh };
  });

  fitToCanvas(renderer, camera, canvas, () => {
    const view = viewSizeAtOrigin(camera);
    rig.scale.setScalar(Math.min(view.width / 6.2, view.height / 6.2));
  });

  const section = canvas.closest('section');
  let elapsed = 0;
  let px = 0;
  let py = 0;

  visibleLoop(canvas, (dt) => {
    elapsed += dt;
    const t = reduceMotion ? 0 : elapsed;
    px = damp(px, pointer.x, 3, dt);
    py = damp(py, pointer.y, 3, dt);

    const r = section.getBoundingClientRect();
    const scrollP = clamp(1 - (r.top + r.height) / (window.innerHeight + r.height), 0, 1);

    logo.rotation.y = Math.sin(t * 0.6) * 0.32 + px * 0.45 + (scrollP - 0.5) * 0.9;
    logo.rotation.x = Math.sin(t * 0.5) * 0.08 - py * 0.22;
    logo.position.y = Math.sin(t * 0.9) * 0.08;

    orbiters.forEach((o, i) => {
      const a = o.angle + t * o.speed;
      o.mesh.position.set(Math.cos(a) * o.radius, o.y + Math.sin(t * 0.9 + i) * 0.12, Math.sin(a) * o.radius * 0.55);
      if (!reduceMotion) {
        o.mesh.rotation.x += dt * 0.3;
        o.mesh.rotation.y += dt * 0.4;
      }
    });

    renderer.render(scene, camera);
  });
}

import * as THREE from 'three';
import { EffectComposer } from './vendor/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './vendor/postprocessing/UnrealBloomPass.js';

// fun fact: Three.js renders in a right-handed coordinate system,
// which means Y is up and Z faces toward the camera — unless you
// stare at it too long and everything starts looking left-handed.

// ─────────────────────────────────────
// RENDERER + COMPOSER
// ─────────────────────────────────────
const canvas = document.getElementById('bg');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030308);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 80);
camera.position.set(0, 2, 10);

// Post-processing
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.2,   // strength
  0.4,   // radius
  0.1    // threshold
);
composer.addPass(bloomPass);

// ─────────────────────────────────────
// LIGHTING
// ─────────────────────────────────────
scene.add(new THREE.AmbientLight(0x1a1a3a, 0.5));

const keyLight = new THREE.PointLight(0x9966ff, 70, 30);
keyLight.position.set(-5, 3, 5);
scene.add(keyLight);

const fillLight = new THREE.PointLight(0x44ccff, 50, 25);
fillLight.position.set(5, -1, 3);
scene.add(fillLight);

const rimLight = new THREE.PointLight(0xff5599, 35, 20);
rimLight.position.set(2, 4, -5);
scene.add(rimLight);

const topLight = new THREE.PointLight(0xffffff, 20, 20);
topLight.position.set(0, 7, 0);
scene.add(topLight);

// ─────────────────────────────────────
// CENTRAL GEOMETRY — CRYSTAL CORE
// ─────────────────────────────────────

// Inner glowing icosahedron
const coreGeo = new THREE.IcosahedronGeometry(0.8, 1);
const coreMat = new THREE.MeshStandardMaterial({
  color: 0xbb99ff,
  emissive: 0x5533aa,
  emissiveIntensity: 0.8,
  metalness: 0.2,
  roughness: 0.15,
});
const core = new THREE.Mesh(coreGeo, coreMat);
scene.add(core);

// Wireframe dodecahedron shell
const shellGeo = new THREE.DodecahedronGeometry(1.5, 0);
const shellMat = new THREE.MeshBasicMaterial({
  color: 0xa78bfa,
  wireframe: true,
  transparent: true,
  opacity: 0.6,
});
const shell = new THREE.Mesh(shellGeo, shellMat);
scene.add(shell);

// Larger outer wireframe
const outerGeo = new THREE.IcosahedronGeometry(2.2, 2);
const outerMat = new THREE.MeshBasicMaterial({
  color: 0x6699ff,
  wireframe: true,
  transparent: true,
  opacity: 0.25,
});
const outerShell = new THREE.Mesh(outerGeo, outerMat);
scene.add(outerShell);

// Torus ring around the core
const ringGeo = new THREE.TorusGeometry(1.9, 0.02, 32, 120);
const ringMat = new THREE.MeshStandardMaterial({
  color: 0x22d3ee,
  emissive: 0x22d3ee,
  emissiveIntensity: 1.5,
  metalness: 0.1,
  roughness: 0.3,
});
const ring = new THREE.Mesh(ringGeo, ringMat);
ring.rotation.x = Math.PI * 0.55;
scene.add(ring);

// Second ring
const ring2Geo = new THREE.TorusGeometry(2.1, 0.015, 32, 100);
const ring2Mat = new THREE.MeshStandardMaterial({
  color: 0xf472b6,
  emissive: 0xf472b6,
  emissiveIntensity: 1.2,
  metalness: 0.1,
  roughness: 0.3,
});
const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
ring2.rotation.x = Math.PI * 0.35;
ring2.rotation.y = Math.PI * 0.3;
scene.add(ring2);

// ─────────────────────────────────────
// ORBITING GLOW SPHERES
// ─────────────────────────────────────
const orbitGroup = new THREE.Group();
scene.add(orbitGroup);

const orbData = [];
const orbGeo = new THREE.SphereGeometry(0.08, 24, 24);

const orbConfigs = [
  { color: 0xfbbf24, emissive: 0xffaa00, radius: 2.8, speed: 0.4, tilt: 0.25, phase: 0 },
  { color: 0x22d3ee, emissive: 0x00ccff, radius: 3.3, speed: -0.35, tilt: 0.7, phase: 1.5 },
  { color: 0xf472b6, emissive: 0xff3388, radius: 3.0, speed: 0.45, tilt: -0.5, phase: 3.0 },
  { color: 0xa78bfa, emissive: 0x8844ff, radius: 3.6, speed: -0.3, tilt: 0.9, phase: 5.0 },
  { color: 0xffffff, emissive: 0xffffff, radius: 2.5, speed: 0.5, tilt: 0.15, phase: 1.0 },
  { color: 0x34d399, emissive: 0x00cc77, radius: 3.4, speed: -0.38, tilt: -0.6, phase: 4.0 },
  { color: 0xff8888, emissive: 0xff4444, radius: 3.1, speed: 0.33, tilt: 0.55, phase: 2.2 },
  { color: 0x88aaff, emissive: 0x3366ff, radius: 3.7, speed: -0.28, tilt: -0.8, phase: 5.8 },
];

orbConfigs.forEach(cfg => {
  const mat = new THREE.MeshStandardMaterial({
    color: cfg.color,
    emissive: cfg.emissive,
    emissiveIntensity: 2.5,
    metalness: 0.0,
    roughness: 0.2,
  });
  const orb = new THREE.Mesh(orbGeo, mat);
  orb.userData = cfg;
  orbitGroup.add(orb);
  orbData.push(orb);
});

// ─────────────────────────────────────
// NEBULA PARTICLES
// ─────────────────────────────────────
const particleCount = window.innerWidth < 768 ? 4000 : 8000;
const pGeo = new THREE.BufferGeometry();
const pPositions = new Float32Array(particleCount * 3);
const pColors = new Float32Array(particleCount * 3);

const color1 = new THREE.Color(0x9966ff);  // purple
const color2 = new THREE.Color(0x44aaff);  // blue
const color3 = new THREE.Color(0xff6699);  // pink
const color4 = new THREE.Color(0xffffff);  // white

for (let i = 0; i < particleCount; i++) {
  const t = Math.random();
  const r = 2.5 + t * 7;
  const angle = t * Math.PI * 6 + Math.random() * 0.4;
  const h = (Math.random() - 0.5) * 5 * (1 - t * 0.5);

  pPositions[i * 3] = Math.cos(angle) * r + (Math.random() - 0.5) * 1.2;
  pPositions[i * 3 + 1] = h;
  pPositions[i * 3 + 2] = Math.sin(angle) * r + (Math.random() - 0.5) * 1.2;

  let c;
  if (t < 0.25) c = color2.clone().lerp(color1, t / 0.25);
  else if (t < 0.5) c = color1.clone().lerp(color4, (t - 0.25) / 0.25);
  else if (t < 0.75) c = color4.clone().lerp(color3, (t - 0.5) / 0.25);
  else c = color3.clone().lerp(color2, (t - 0.75) / 0.25);

  pColors[i * 3] = c.r;
  pColors[i * 3 + 1] = c.g;
  pColors[i * 3 + 2] = c.b;
}

pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

const pMat = new THREE.PointsMaterial({
  size: 0.04,
  vertexColors: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  transparent: true,
  opacity: 0.8,
});

const nebula = new THREE.Points(pGeo, pMat);
scene.add(nebula);

// ─────────────────────────────────────
// FLOATING DIAMOND ACCENTS
// ─────────────────────────────────────
const accents = [];
const octGeo = new THREE.OctahedronGeometry(0.12, 0);

for (let i = 0; i < 15; i++) {
  const hue = 0.6 + Math.random() * 0.25;
  const col = new THREE.Color().setHSL(hue, 0.7, 0.5 + Math.random() * 0.3);
  const mat = new THREE.MeshStandardMaterial({
    color: col,
    emissive: col,
    emissiveIntensity: 1.5,
    metalness: 0.3,
    roughness: 0.2,
  });
  const oct = new THREE.Mesh(octGeo, mat);
  oct.position.set(
    (Math.random() - 0.5) * 12,
    (Math.random() - 0.5) * 8,
    (Math.random() - 0.5) * 10 - 3
  );
  oct.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  oct.userData = {
    baseY: oct.position.y,
    speed: 0.2 + Math.random() * 0.6,
    amp: 0.3 + Math.random() * 1.0,
    phase: Math.random() * Math.PI * 2,
    rotSpeed: 0.3 + Math.random() * 0.8,
  };
  scene.add(oct);
  accents.push(oct);
}

// ─────────────────────────────────────
// GROUND GRID
// ─────────────────────────────────────
const gridHelper = new THREE.PolarGridHelper(8, 48, 32, 64, 0x334466, 0x223355);
gridHelper.position.y = -4;
scene.add(gridHelper);

// ─────────────────────────────────────
// CAMERA PATH KEYFRAMES
// ─────────────────────────────────────
const keyframes = [
  { s: 0.0,  pos: [0, 1.8, 8],    look: [0, 0, 0] },
  { s: 0.2,  pos: [4, 2.2, 7.5],  look: [0, 0.5, 0] },
  { s: 0.4,  pos: [-5, 3, 7],     look: [0, 0, 0] },
  { s: 0.6,  pos: [3, -1, 5.5],   look: [1, 0, -2] },
  { s: 0.8,  pos: [-3, -0.5, 6],  look: [-1, 0, 2] },
  { s: 1.0,  pos: [0, 5, 14],     look: [0, 0, 0] },
];

function getScrollFrac() {
  const h = document.documentElement.scrollHeight - window.innerHeight;
  return h > 0 ? window.scrollY / h : 0;
}

function lerpKf(frac) {
  const k = keyframes;
  if (frac <= k[0].s) return k[0];
  if (frac >= k[k.length - 1].s) return k[k.length - 1];
  let i = 0;
  while (k[i + 1].s < frac) i++;
  const a = k[i], b = k[i + 1];
  const t = (frac - a.s) / (b.s - a.s);
  return {
    pos: [a.pos[0] + (b.pos[0] - a.pos[0]) * t, a.pos[1] + (b.pos[1] - a.pos[1]) * t, a.pos[2] + (b.pos[2] - a.pos[2]) * t],
    look: [a.look[0] + (b.look[0] - a.look[0]) * t, a.look[1] + (b.look[1] - a.look[1]) * t, a.look[2] + (b.look[2] - a.look[2]) * t],
  };
}

// ─────────────────────────────────────
// MOUSE
// ─────────────────────────────────────
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
document.addEventListener('mousemove', e => {
  mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.ty = -(e.clientY / window.innerHeight) * 2 + 1;
});

// ─────────────────────────────────────
// ANIMATION LOOP
// ─────────────────────────────────────
const clock = new THREE.Clock();
const camTarget = new THREE.Vector3();
const camLook = new THREE.Vector3();
const curLook = new THREE.Vector3();

function animate() {
  const dt = Math.min(clock.getDelta(), 0.1);
  const time = performance.now() * 0.001;

  // Smooth mouse
  mouse.x += (mouse.tx - mouse.x) * 2.5 * dt;
  mouse.y += (mouse.ty - mouse.y) * 2.5 * dt;

  // Scroll → camera
  const kf = lerpKf(getScrollFrac());
  camTarget.set(kf.pos[0], kf.pos[1], kf.pos[2]);
  camLook.set(kf.look[0] + mouse.x * 0.6, kf.look[1] + mouse.y * 0.4, kf.look[2]);

  camera.position.lerp(camTarget, 1.2 * dt);
  curLook.lerp(camLook, 2.0 * dt);
  camera.lookAt(curLook);

  // Animate core
  core.rotation.y += dt * 0.25;
  core.rotation.x += dt * 0.1;
  shell.rotation.y -= dt * 0.2;
  shell.rotation.x += dt * 0.15;
  outerShell.rotation.y += dt * 0.12;
  outerShell.rotation.z -= dt * 0.08;

  // Rings
  ring.rotation.z += dt * 0.35;
  ring2.rotation.z -= dt * 0.28;
  ring2.rotation.x += dt * 0.15;

  // Orbit group
  orbitGroup.rotation.y += dt * 0.08;

  // Individual orbs
  orbData.forEach(orb => {
    const cfg = orb.userData;
    const a = time * cfg.speed + cfg.phase;
    orb.position.x = Math.cos(a) * cfg.radius;
    orb.position.z = Math.sin(a) * cfg.radius;
    orb.position.y = Math.sin(a * 0.7) * cfg.radius * Math.sin(cfg.tilt);
  });

  // Nebula drift
  nebula.rotation.y += dt * 0.025;
  nebula.rotation.x += dt * 0.012;

  // Floating accents
  accents.forEach(oct => {
    const u = oct.userData;
    oct.position.y = u.baseY + Math.sin(time * u.speed + u.phase) * u.amp;
    oct.rotation.x += dt * u.rotSpeed * 0.5;
    oct.rotation.y += dt * u.rotSpeed * 0.6;
  });

  // Mouse influences core
  core.position.lerp(new THREE.Vector3(mouse.x * 0.4, mouse.y * 0.3, 0), 0.8 * dt);
  shell.position.copy(core.position);
  ring.position.copy(core.position);
  ring2.position.copy(core.position);

  // Bloom varies subtly with scroll
  const sf = getScrollFrac();
  bloomPass.strength = 1.0 + sf * 0.5;

  composer.render();
  requestAnimationFrame(animate);
}

// ─────────────────────────────────────
// RESIZE
// ─────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// ─────────────────────────────────────
// PROJECT HOVER → BLOOM BOOST
// ─────────────────────────────────────
document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('mouseenter', () => { bloomPass.strength = 2.0; });
  card.addEventListener('mouseleave', () => { bloomPass.strength = 1.2; });
});

// ─────────────────────────────────────
// GO
// ─────────────────────────────────────
animate();

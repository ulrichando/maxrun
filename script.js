import * as THREE from 'three';

// ─────────────────────────────────────
// SETUP
// ─────────────────────────────────────
const canvas = document.getElementById('bg');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#050510');
scene.fog = new THREE.FogExp2('#050510', 0.00015);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.5, 8);

// ─────────────────────────────────────
// LIGHTS
// ─────────────────────────────────────
const ambient = new THREE.AmbientLight('#332255', 0.6);
scene.add(ambient);

const light1 = new THREE.PointLight('#9966ff', 80, 25);
light1.position.set(-6, 3, 4);
scene.add(light1);

const light2 = new THREE.PointLight('#44ccff', 50, 20);
light2.position.set(5, -1, 3);
scene.add(light2);

const light3 = new THREE.PointLight('#ff6699', 30, 18);
light3.position.set(2, 4, -4);
scene.add(light3);

const spotLight = new THREE.SpotLight('#ffffff', 15, 30, Math.PI / 6, 0.3, 0.5);
spotLight.position.set(0, 8, 2);
scene.add(spotLight);

// ─────────────────────────────────────
// CENTRAL GEOMETRY — Torus Knot
// ─────────────────────────────────────
const knotGeo = new THREE.TorusKnotGeometry(1.8, 0.35, 256, 40, 3, 4);
const knotMat = new THREE.MeshStandardMaterial({
  color: '#8866cc',
  metalness: 0.7,
  roughness: 0.25,
  emissive: '#221144',
  emissiveIntensity: 0.3,
});
const knot = new THREE.Mesh(knotGeo, knotMat);
scene.add(knot);

// Wireframe shell around knot
const knotWireGeo = new THREE.TorusKnotGeometry(2.0, 0.02, 200, 32, 3, 4);
const knotWireMat = new THREE.MeshBasicMaterial({ color: '#a78bfa', wireframe: true, transparent: true, opacity: 0.5 });
const knotWire = new THREE.Mesh(knotWireGeo, knotWireMat);
scene.add(knotWire);

// ─────────────────────────────────────
// ORBITING SPHERES
// ─────────────────────────────────────
const orbitingSpheres = [];
const sphereGeo = new THREE.SphereGeometry(0.12, 32, 32);

const sphereConfigs = [
  { color: '#fbbf24', emissive: '#442200', radius: 3.2, speed: 0.3, tilt: 0.3, phase: 0 },
  { color: '#22d3ee', emissive: '#003344', radius: 3.8, speed: -0.25, tilt: 0.8, phase: 1.2 },
  { color: '#f472b6', emissive: '#330022', radius: 3.5, speed: 0.35, tilt: -0.5, phase: 2.5 },
  { color: '#a78bfa', emissive: '#110033', radius: 4.1, speed: -0.2, tilt: 1.0, phase: 4.0 },
  { color: '#ffffff', emissive: '#111111', radius: 3.0, speed: 0.28, tilt: 0.1, phase: 0.8 },
  { color: '#34d399', emissive: '#002211', radius: 3.9, speed: -0.32, tilt: -0.7, phase: 3.0 },
];

sphereConfigs.forEach(cfg => {
  const mat = new THREE.MeshStandardMaterial({
    color: cfg.color,
    emissive: cfg.emissive,
    emissiveIntensity: 0.5,
    metalness: 0.3,
    roughness: 0.2,
  });
  const sphere = new THREE.Mesh(sphereGeo, mat);
  sphere.userData = cfg;
  scene.add(sphere);
  orbitingSpheres.push(sphere);
});

// ─────────────────────────────────────
// ORBITING ICOSAHEDRONS
// ─────────────────────────────────────
const orbitingIcos = [];
const icoGeo = new THREE.IcosahedronGeometry(0.18, 0);

const icoConfigs = [
  { color: '#c084fc', radius: 2.6, speed: 0.4, tilt: 1.2, phase: 1.0 },
  { color: '#38bdf8', radius: 4.4, speed: -0.22, tilt: -0.9, phase: 2.0 },
  { color: '#fb7185', radius: 3.3, speed: 0.33, tilt: 0.4, phase: 3.5 },
];

icoConfigs.forEach(cfg => {
  const mat = new THREE.MeshStandardMaterial({
    color: cfg.color,
    metalness: 0.6,
    roughness: 0.15,
    emissive: cfg.color,
    emissiveIntensity: 0.2,
  });
  const ico = new THREE.Mesh(icoGeo, mat);
  ico.userData = cfg;
  scene.add(ico);
  orbitingIcos.push(ico);
});

// ─────────────────────────────────────
// DECORATIVE RINGS
// ─────────────────────────────────────
const ringGeos = [
  { radius: 2.4, tube: 0.015, y: 0.5, rotX: Math.PI * 0.45, color: '#a78bfa', opacity: 0.35 },
  { radius: 3.0, tube: 0.012, y: -0.3, rotX: Math.PI * 0.6, color: '#22d3ee', opacity: 0.3 },
  { radius: 4.5, tube: 0.01, y: 0, rotX: Math.PI * 0.3, color: '#f472b6', opacity: 0.25 },
];

ringGeos.forEach(cfg => {
  const geo = new THREE.TorusGeometry(cfg.radius, cfg.tube, 16, 180);
  const mat = new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: cfg.opacity });
  const ring = new THREE.Mesh(geo, mat);
  ring.position.y = cfg.y;
  ring.rotation.x = cfg.rotX;
  ring.userData = { baseRotX: cfg.rotX };
  scene.add(ring);
});

// ─────────────────────────────────────
// PARTICLE NEBULA
// ─────────────────────────────────────
const particleCount = window.innerWidth < 768 ? 3000 : 6000;
const particleGeo = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);

const colorA = new THREE.Color('#a78bfa');
const colorB = new THREE.Color('#22d3ee');
const colorC = new THREE.Color('#f472b6');
const colorD = new THREE.Color('#ffffff');

for (let i = 0; i < particleCount; i++) {
  // Spiral nebula distribution
  const t = Math.random();
  const radius = 2 + t * 8;
  const angle = t * Math.PI * 8 + Math.random() * 0.5;
  const height = (Math.random() - 0.5) * 6 * (1 - t * 0.6);

  positions[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 1.5;
  positions[i * 3 + 1] = height;
  positions[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 1.5;

  // Color gradient: inner warm → outer cool
  let col;
  if (t < 0.3) col = colorA.clone().lerp(colorD, t / 0.3);
  else if (t < 0.6) col = colorA.clone().lerp(colorB, (t - 0.3) / 0.3);
  else col = colorB.clone().lerp(colorC, (t - 0.6) / 0.4);

  colors[i * 3] = col.r;
  colors[i * 3 + 1] = col.g;
  colors[i * 3 + 2] = col.b;
}

particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const particleMat = new THREE.PointsMaterial({
  size: 0.035,
  vertexColors: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  transparent: true,
  opacity: 0.7,
});

const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

// ─────────────────────────────────────
// FLOATING ACCENT CUBES
// ─────────────────────────────────────
const accentCubes = [];
const cubeGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);

for (let i = 0; i < 12; i++) {
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(0.7 + Math.random() * 0.2, 0.6, 0.5 + Math.random() * 0.3),
    metalness: 0.8,
    roughness: 0.2,
  });
  const cube = new THREE.Mesh(cubeGeo, mat);
  cube.position.set(
    (Math.random() - 0.5) * 10,
    (Math.random() - 0.5) * 8,
    (Math.random() - 0.5) * 8 - 2
  );
  cube.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  cube.userData = {
    basePos: cube.position.clone(),
    floatSpeed: 0.3 + Math.random() * 0.7,
    floatAmp: 0.3 + Math.random() * 0.8,
    rotSpeed: 0.3 + Math.random() * 0.7,
    phase: Math.random() * Math.PI * 2,
  };
  scene.add(cube);
  accentCubes.push(cube);
}

// ─────────────────────────────────────
// SCROLL-DRIVEN CAMERA PATH
// ─────────────────────────────────────
const cameraKeyframes = [
  { scroll: 0,    pos: [0, 1.5, 7],    look: [0, 0, 0] },
  { scroll: 0.2,  pos: [3, 2, 7.5],     look: [0, 0.5, 0] },
  { scroll: 0.4,  pos: [-4, 2.5, 8],    look: [0, 0, 0] },
  { scroll: 0.6,  pos: [5, 0.5, 6],     look: [1, 0, -1] },
  { scroll: 0.8,  pos: [-2, -1, 5],     look: [2, -0.5, -1] },
  { scroll: 1.0,  pos: [0, 4, 12],      look: [0, 0, 0] },
];

function getScrollFraction() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  return docHeight > 0 ? scrollTop / docHeight : 0;
}

function lerpKeyframes(fraction) {
  const kf = cameraKeyframes;
  if (fraction <= kf[0].scroll) return kf[0];
  if (fraction >= kf[kf.length - 1].scroll) return kf[kf.length - 1];

  let i = 0;
  while (i < kf.length - 1 && kf[i + 1].scroll < fraction) i++;

  const a = kf[i];
  const b = kf[i + 1];
  const t = (fraction - a.scroll) / (b.scroll - a.scroll);

  return {
    pos: [
      a.pos[0] + (b.pos[0] - a.pos[0]) * t,
      a.pos[1] + (b.pos[1] - a.pos[1]) * t,
      a.pos[2] + (b.pos[2] - a.pos[2]) * t,
    ],
    look: [
      a.look[0] + (b.look[0] - a.look[0]) * t,
      a.look[1] + (b.look[1] - a.look[1]) * t,
      a.look[2] + (b.look[2] - a.look[2]) * t,
    ],
  };
}

// ─────────────────────────────────────
// MOUSE PARALLAX
// ─────────────────────────────────────
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

document.addEventListener('mousemove', (e) => {
  mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.ty = -(e.clientY / window.innerHeight) * 2 + 1;
});

// ─────────────────────────────────────
// ANIMATION LOOP
// ─────────────────────────────────────
const clock = new THREE.Clock();
const targetPos = new THREE.Vector3();
const targetLook = new THREE.Vector3();
const currentLook = new THREE.Vector3();

function animate() {
  const dt = Math.min(clock.getDelta(), 0.1);
  const time = performance.now() * 0.001;

  // ── smooth mouse ──
  mouse.x += (mouse.tx - mouse.x) * 3 * dt;
  mouse.y += (mouse.ty - mouse.y) * 3 * dt;

  // ── scroll camera target ──
  const scrollFrac = getScrollFraction();
  const kf = lerpKeyframes(scrollFrac);
  targetPos.set(kf.pos[0], kf.pos[1], kf.pos[2]);
  targetLook.set(kf.look[0], kf.look[1], kf.look[2]);

  // Mouse parallax on look target
  targetLook.x += mouse.x * 0.8;
  targetLook.y += mouse.y * 0.6;

  // Smooth camera
  camera.position.lerp(targetPos, 1.5 * dt);
  currentLook.lerp(targetLook, 2.0 * dt);
  camera.lookAt(currentLook);

  // ── rotate central knot ──
  knot.rotation.y += dt * 0.15;
  knot.rotation.x += dt * 0.05;
  knotWire.rotation.copy(knot.rotation);

  // ── orbit spheres ──
  orbitingSpheres.forEach(sphere => {
    const cfg = sphere.userData;
    const angle = time * cfg.speed + cfg.phase;
    sphere.position.x = Math.cos(angle) * cfg.radius;
    sphere.position.z = Math.sin(angle) * cfg.radius;
    sphere.position.y = Math.sin(angle * 0.7) * cfg.radius * Math.sin(cfg.tilt);
  });

  // ── orbit icosahedrons ──
  orbitingIcos.forEach(ico => {
    const cfg = ico.userData;
    const angle = time * cfg.speed + cfg.phase;
    ico.position.x = Math.cos(angle) * cfg.radius;
    ico.position.z = Math.sin(angle) * cfg.radius;
    ico.position.y = Math.cos(angle * 0.6) * cfg.radius * Math.sin(cfg.tilt);
    ico.rotation.x += dt * 0.5;
    ico.rotation.y += dt * 0.7;
  });

  // ── rotate particles slowly ──
  particles.rotation.y += dt * 0.03;
  particles.rotation.x += dt * 0.01;

  // ── float accent cubes ──
  accentCubes.forEach(cube => {
    const ud = cube.userData;
    cube.position.y = ud.basePos.y + Math.sin(time * ud.floatSpeed + ud.phase) * ud.floatAmp;
    cube.rotation.x += dt * ud.rotSpeed * 0.5;
    cube.rotation.y += dt * ud.rotSpeed * 0.7;
  });

  // ── mouse influence on central geometry ──
  knot.position.x += (mouse.x * 0.3 - knot.position.x) * 0.5 * dt;
  knot.position.y += (mouse.y * 0.2 - knot.position.y) * 0.5 * dt;
  knotWire.position.copy(knot.position);

  // ── render ──
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// ─────────────────────────────────────
// RESIZE
// ─────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─────────────────────────────────────
// PROJECT CARD HOVER → 3D REACTION
// ─────────────────────────────────────
document.querySelectorAll('.project-card').forEach((card, i) => {
  card.addEventListener('mouseenter', () => {
    orbitingIcos[i] && (orbitingIcos[i].material.emissiveIntensity = 1.5);
    knotMat.emissiveIntensity = 0.6;
    knotWireMat.opacity = 0.8;
  });
  card.addEventListener('mouseleave', () => {
    orbitingIcos[i] && (orbitingIcos[i].material.emissiveIntensity = 0.2);
    knotMat.emissiveIntensity = 0.3;
    knotWireMat.opacity = 0.5;
  });
});

// ─────────────────────────────────────
// GO
// ─────────────────────────────────────
animate();

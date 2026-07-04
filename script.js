import * as THREE from 'three';
import { EffectComposer } from './vendor/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/postprocessing/RenderPass.js';
import { ShaderPass } from './vendor/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from './vendor/postprocessing/UnrealBloomPass.js';
import { PhysicsWorld } from './vendor/Physics.js';
import { CosmicFieldShader, ShimmerShader, EnergyRingShader } from './vendor/shaders/CustomShaders.js';

// ═══════════════════════════════════════
// RENDERER SETUP
// ═══════════════════════════════════════
const canvas = document.getElementById('bg');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.5, 12);

// ═══════════════════════════════════════
// CUSTOM COSMIC BACKGROUND SHADER
// ═══════════════════════════════════════
const cosmicBg = new ShaderPass(CosmicFieldShader);
cosmicBg.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
cosmicBg.uniforms.uMouse.value.set(0, 0);

// ═══════════════════════════════════════
// POST-PROCESSING STACK
// ═══════════════════════════════════════
const composer = new EffectComposer(renderer);

// 1. Background shader pass
composer.addPass(cosmicBg);

// 2. Render the 3D scene on top
const renderPass = new RenderPass(scene, camera);
renderPass.clear = false;
composer.addPass(renderPass);

// 3. Bloom
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.9,   // strength
  0.5,   // radius
  0.15   // threshold
);
composer.addPass(bloomPass);

// 4. Custom grain + vignette + chromatic aberration pass
const PostFXShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uIntensity: { value: 0.0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uIntensity;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    void main() {
      vec2 uv = vUv;

      // Chromatic aberration (subtle, intensity-driven)
      float chroma = uIntensity * 1.5;
      float r = texture2D(tDiffuse, uv + vec2(chroma * 0.003, 0.0)).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - vec2(chroma * 0.003, 0.0)).b;
      vec3 color = vec3(r, g, b);

      // Vignette
      vec2 centered = uv - 0.5;
      float vignette = 1.0 - dot(centered, centered) * 1.3;
      vignette = smoothstep(0.0, 0.85, vignette);

      // Film grain
      float grain = hash(uv + fract(uTime * 0.01)) * 0.04;

      color *= vignette;
      color += grain;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

const postFX = new ShaderPass(PostFXShader);
composer.addPass(postFX);

// ═══════════════════════════════════════
// LIGHTING
// ═══════════════════════════════════════
scene.add(new THREE.AmbientLight(0x181830, 0.6));

const lights = [
  { color: 0x9966ff, intensity: 60, pos: [-6, 3, 6] },
  { color: 0x44ccff, intensity: 45, pos: [5, -2, 4] },
  { color: 0xff5577, intensity: 30, pos: [3, 5, -5] },
  { color: 0xffffff, intensity: 15, pos: [0, 6, 2] },
  { color: 0xffaa44, intensity: 25, pos: [-4, -3, -3] },
];

lights.forEach(l => {
  const light = new THREE.PointLight(l.color, l.intensity, 28);
  light.position.set(...l.pos);
  scene.add(light);
});

// ═══════════════════════════════════════
// PHYSICS WORLD
// ═══════════════════════════════════════
const physics = new PhysicsWorld();

// ═══════════════════════════════════════
// CENTRAL MORPHING GEOMETRY
// ═══════════════════════════════════════
const morphGroup = new THREE.Group();
scene.add(morphGroup);

// We'll use a torus knot as the base and morph parameters
const baseGeo = new THREE.TorusKnotGeometry(1.3, 0.28, 200, 32, 3, 4);
const shimmerMat = new THREE.ShaderMaterial({
  ...ShimmerShader,
  lights: true,
});
shimmerMat.uniforms.uColor.value.set(0x8866ee);
const mainMesh = new THREE.Mesh(baseGeo, shimmerMat);
morphGroup.add(mainMesh);

// Wireframe overlay
const wireGeo = new THREE.TorusKnotGeometry(1.38, 0.01, 200, 32, 3, 4);
const wireMat = new THREE.MeshBasicMaterial({
  color: 0xa78bfa,
  wireframe: true,
  transparent: true,
  opacity: 0.4,
});
const wireOverlay = new THREE.Mesh(wireGeo, wireMat);
morphGroup.add(wireOverlay);

// ═══════════════════════════════════════
// ENERGY RINGS (3 layers)
// ═══════════════════════════════════════
const rings = [];
const ringConfigs = [
  { radius: 1.8, tube: 0.015, rotX: Math.PI * 0.5, speed: 0.3, color: 0x22d3ee },
  { radius: 2.2, tube: 0.012, rotX: Math.PI * 0.35, speed: -0.25, color: 0xf472b6 },
  { radius: 2.0, tube: 0.018, rotX: Math.PI * 0.6, speed: 0.2, color: 0xa78bfa },
];

ringConfigs.forEach(cfg => {
  const geo = new THREE.TorusGeometry(cfg.radius, cfg.tube, 16, 128);
  const mat = new THREE.ShaderMaterial({
    ...EnergyRingShader,
  });
  mat.uniforms.uColor.value.set(cfg.color);
  const ring = new THREE.Mesh(geo, mat);
  ring.rotation.x = cfg.rotX;
  ring.userData = { speed: cfg.speed };
  morphGroup.add(ring);
  rings.push(ring);
});

// ═══════════════════════════════════════
// PHYSICS-BASED FLOATING CRYSTALS
// ═══════════════════════════════════════
const crystals = [];
const crystalShapes = [
  () => new THREE.OctahedronGeometry(0.1 + Math.random() * 0.12, 0),
  () => new THREE.IcosahedronGeometry(0.08 + Math.random() * 0.1, 0),
  () => new THREE.TetrahedronGeometry(0.09 + Math.random() * 0.11, 0),
  () => new THREE.DodecahedronGeometry(0.07 + Math.random() * 0.09, 0),
];

for (let i = 0; i < 24; i++) {
  const shapeFn = crystalShapes[Math.floor(Math.random() * crystalShapes.length)];
  const geo = shapeFn();
  const hue = 0.6 + Math.random() * 0.25;
  const col = new THREE.Color().setHSL(hue, 0.7, 0.45 + Math.random() * 0.35);
  const mat = new THREE.MeshStandardMaterial({
    color: col,
    emissive: col,
    emissiveIntensity: 1.2,
    metalness: 0.2,
    roughness: 0.22,
  });
  const crystal = new THREE.Mesh(geo, mat);

  // Distribute around the central geometry
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.random() * Math.PI * 0.7;
  const r = 2.0 + Math.random() * 3.5;
  crystal.position.set(
    Math.cos(theta) * Math.cos(phi) * r,
    Math.sin(phi) * r * 0.8 + (Math.random() - 0.5) * 2,
    Math.sin(theta) * Math.cos(phi) * r
  );
  crystal.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  crystal.userData = {
    rotSpeed: new THREE.Vector3(
      (Math.random() - 0.5) * 0.8,
      (Math.random() - 0.5) * 0.8,
      (Math.random() - 0.5) * 0.8,
    ),
  };

  scene.add(crystal);
  const body = physics.addBody(crystal, {
    damping: 0.94,
    springForce: 0.015 + Math.random() * 0.02,
    mass: 0.5 + Math.random() * 1.5,
  });
  crystals.push({ mesh: crystal, body });
}

// ═══════════════════════════════════════
// PARTICLE TRAIL (cursor-following)
// ═══════════════════════════════════════
const trailCount = 200;
const trailGeo = new THREE.BufferGeometry();
const trailPositions = new Float32Array(trailCount * 3);
const trailSizes = new Float32Array(trailCount);
const trailColors = new Float32Array(trailCount * 3);

const trailPoints = [];
for (let i = 0; i < trailCount; i++) {
  trailPoints.push({
    pos: new THREE.Vector3(0, 0, -50), // far away initially
    life: 0,
    maxLife: 0.6 + Math.random() * 1.5,
    color: new THREE.Color().setHSL(0.65 + Math.random() * 0.25, 0.8, 0.5 + Math.random() * 0.4),
  });
}

trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
trailGeo.setAttribute('size', new THREE.BufferAttribute(trailSizes, 1));
trailGeo.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));

// Custom trail texture (radial gradient via canvas)
const trailCanvas = document.createElement('canvas');
trailCanvas.width = 32;
trailCanvas.height = 32;
const tctx = trailCanvas.getContext('2d');
const gradient = tctx.createRadialGradient(16, 16, 0, 16, 16, 16);
gradient.addColorStop(0, 'rgba(255,255,255,1)');
gradient.addColorStop(0.15, 'rgba(255,200,255,0.8)');
gradient.addColorStop(0.4, 'rgba(160,100,255,0.3)');
gradient.addColorStop(1, 'rgba(0,0,0,0)');
tctx.fillStyle = gradient;
tctx.fillRect(0, 0, 32, 32);
const trailTexture = new THREE.CanvasTexture(trailCanvas);

const trailMat = new THREE.PointsMaterial({
  size: 0.25,
  map: trailTexture,
  vertexColors: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  transparent: true,
  opacity: 0.8,
});

const trailSystem = new THREE.Points(trailGeo, trailMat);
scene.add(trailSystem);

// Trail emission state
let trailIndex = 0;
const trailSpawnTimer = { value: 0 };
const mouse3D = new THREE.Vector3();
const raycaster = new THREE.Raycaster();

// ═══════════════════════════════════════
// RAYCASTING TARGETS
// ═══════════════════════════════════════
const hoverTargets = [mainMesh, ...crystals.map(c => c.mesh)];
let hoveredObject = null;

// ═══════════════════════════════════════
// SCROLL-DRIVEN CAMERA PATH
// ═══════════════════════════════════════
const keyframes = [
  { s: 0.0,  pos: [0, 1.5, 10],   look: [0, 0.2, 0] },
  { s: 0.15, pos: [3.5, 2, 8.5],  look: [0, 0.3, 0] },
  { s: 0.35, pos: [-4, 3, 8],     look: [0, -0.2, 0] },
  { s: 0.55, pos: [2, -1.5, 6.5],  look: [0.5, 0, -2] },
  { s: 0.75, pos: [-2.5, -0.5, 7], look: [-0.5, 0.2, 2] },
  { s: 1.0,  pos: [0, 4, 15],     look: [0, 0, 0] },
];

function getScrollFrac() {
  const h = document.documentElement.scrollHeight - window.innerHeight;
  return h > 0 ? window.scrollY / h : 0;
}

function lerpKeyframes(frac) {
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

// ═══════════════════════════════════════
// MOUSE STATE
// ═══════════════════════════════════════
const mouse = { x: 0, y: 0, tx: 0, ty: 0, sx: 0, sy: 0 };
document.addEventListener('mousemove', e => {
  mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.ty = -(e.clientY / window.innerHeight) * 2 + 1;
});

// ═══════════════════════════════════════
// PROJECT CARD HOVER BOOST
// ═══════════════════════════════════════
document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('mouseenter', () => {
    bloomPass.strength = 1.6;
    postFX.uniforms.uIntensity.value = 1.0;
  });
  card.addEventListener('mouseleave', () => {
    bloomPass.strength = 0.9;
    postFX.uniforms.uIntensity.value = 0.0;
  });
});

// ═══════════════════════════════════════
// ANIMATION LOOP
// ═══════════════════════════════════════
const clock = new THREE.Clock();
const camTarget = new THREE.Vector3();
const camLookAt = new THREE.Vector3();
const curLook = new THREE.Vector3();
const worldMouse = new THREE.Vector3();

function animate() {
  const rawDt = clock.getDelta();
  const dt = Math.min(rawDt, 0.1);
  const time = performance.now() * 0.001;

  // ── Smooth mouse ──
  mouse.x += (mouse.tx - mouse.x) * 3.5 * dt;
  mouse.y += (mouse.ty - mouse.y) * 3.5 * dt;
  mouse.sx += (mouse.tx - mouse.sx) * 1.5 * dt;  // slower for background
  mouse.sy += (mouse.ty - mouse.sy) * 1.5 * dt;

  const sf = getScrollFrac();

  // ── Background shader uniforms ──
  cosmicBg.uniforms.uTime.value = time;
  cosmicBg.uniforms.uMouse.value.set(mouse.sx * 0.5, mouse.sy * 0.5);
  cosmicBg.uniforms.uScroll.value = sf;

  // ── Post FX ──
  postFX.uniforms.uTime.value = time;

  // ── Camera ──
  const kf = lerpKeyframes(sf);
  camTarget.set(kf.pos[0], kf.pos[1], kf.pos[2]);
  camLookAt.set(
    kf.look[0] + mouse.x * 0.8,
    kf.look[1] + mouse.y * 0.6,
    kf.look[2]
  );
  camera.position.lerp(camTarget, 1.5 * dt);
  curLook.lerp(camLookAt, 2.5 * dt);
  camera.lookAt(curLook);

  // ── Morphing geometry ──
  mainMesh.rotation.y += dt * 0.2;
  mainMesh.rotation.x += dt * 0.08;
  wireOverlay.rotation.copy(mainMesh.rotation);

  // Scale pulse
  const pulse = 1 + Math.sin(time * 1.5) * 0.03 + Math.cos(time * 2.3) * 0.02;
  mainMesh.scale.setScalar(pulse);
  wireOverlay.scale.setScalar(pulse);

  // Scroll transforms geometry
  morphGroup.position.y = Math.sin(sf * Math.PI) * 0.5;
  morphGroup.rotation.z = sf * 0.3;

  // Shimmer uniforms
  shimmerMat.uniforms.uTime.value = time;
  shimmerMat.uniforms.uScroll.value = sf;
  shimmerMat.uniforms.uColor.value.setHSL(0.72 + sf * 0.1, 0.7, 0.55);

  // ── Energy rings ──
  rings.forEach(ring => {
    ring.rotation.z += dt * ring.userData.speed;
    ring.material.uniforms.uTime.value = time;
    ring.material.uniforms.uIntensity.value = 0.8 + Math.sin(time * 2) * 0.2;
  });

  // ── Physics step ──
  physics.step(dt);

  // ── Cursor attraction/repulsion on crystals ──
  // Project mouse to 3D plane at z=0
  const mouseNDC = new THREE.Vector2(mouse.x, mouse.y);
  raycaster.setFromCamera(mouseNDC, camera);
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  raycaster.ray.intersectPlane(plane, mouse3D);

  if (mouse3D) {
    physics.repulseAll(mouse3D, 0.08, 1.5);
    physics.attractAll(mouse3D, 0.002, 6.0);
  }

  // ── Raycasting for hover ──
  raycaster.setFromCamera(new THREE.Vector2(mouse.x, mouse.y), camera);
  const intersects = raycaster.intersectObjects(hoverTargets, false);

  if (intersects.length > 0) {
    const obj = intersects[0].object;
    if (hoveredObject !== obj) {
      // Reset previous
      if (hoveredObject && hoveredObject.material.emissiveIntensity !== undefined) {
        hoveredObject.material.emissiveIntensity = hoveredObject.userData._baseEmissive ?? 1.2;
      }
      hoveredObject = obj;
      // Store and boost
      if (obj.material.emissiveIntensity !== undefined) {
        obj.userData._baseEmissive ??= obj.material.emissiveIntensity;
        obj.material.emissiveIntensity = 3.0;
      }
    }
  } else if (hoveredObject) {
    if (hoveredObject.material.emissiveIntensity !== undefined) {
      hoveredObject.material.emissiveIntensity = hoveredObject.userData._baseEmissive ?? 1.2;
    }
    hoveredObject = null;
  }

  // ── Crystal rotation ──
  crystals.forEach(c => {
    const u = c.mesh.userData.rotSpeed;
    c.mesh.rotation.x += dt * u.x;
    c.mesh.rotation.y += dt * u.y;
    c.mesh.rotation.z += dt * u.z;
  });

  // ── Particle trail ──
  trailSpawnTimer.value += dt;
  if (trailSpawnTimer.value > 0.03 && mouse3D) {
    trailSpawnTimer.value = 0;

    // Spawn at mouse 3D position with jitter
    const spawnPos = mouse3D.clone().add(
      new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3
      )
    );

    const pt = trailPoints[trailIndex];
    pt.pos.copy(spawnPos);
    pt.life = pt.maxLife;

    trailIndex = (trailIndex + 1) % trailCount;
  }

  // Update trail particles
  for (let i = 0; i < trailCount; i++) {
    const pt = trailPoints[i];
    pt.life -= dt;
    if (pt.life < 0) pt.life = 0;

    const alpha = pt.life / pt.maxLife;

    // Float upward and outward
    pt.pos.y += dt * 0.15;
    pt.pos.x += (Math.sin(time * 3 + i) * dt * 0.1);
    pt.pos.z += (Math.cos(time * 3 + i) * dt * 0.1);

    trailPositions[i * 3] = pt.pos.x;
    trailPositions[i * 3 + 1] = pt.pos.y;
    trailPositions[i * 3 + 2] = pt.pos.z;
    trailSizes[i] = alpha * 0.3;
    trailColors[i * 3] = pt.color.r * alpha;
    trailColors[i * 3 + 1] = pt.color.g * alpha;
    trailColors[i * 3 + 2] = pt.color.b * alpha;
  }

  trailGeo.attributes.position.needsUpdate = true;
  trailGeo.attributes.size.needsUpdate = true;
  trailGeo.attributes.color.needsUpdate = true;

  // ── Render ──
  composer.render();
  requestAnimationFrame(animate);
}

// ═══════════════════════════════════════
// RESIZE
// ═══════════════════════════════════════
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  cosmicBg.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
  postFX.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
});

// ═══════════════════════════════════════
// GO
// ═══════════════════════════════════════
animate();

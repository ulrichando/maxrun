// ─────────────────────────────────────────────
// COSMIC FIELD — fullscreen background shader
// ─────────────────────────────────────────────
export const CosmicFieldShader = {
  uniforms: {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2() },
    uMouse: { value: new THREE.Vector2() },
    uScroll: { value: 0 },
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
    uniform float uTime;
    uniform vec2 uResolution;
    uniform vec2 uMouse;
    uniform float uScroll;

    // Noise functions
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
      );
    }

    float fbm(vec2 p) {
      float val = 0.0;
      float amp = 0.5;
      float freq = 1.0;
      for (int i = 0; i < 5; i++) {
        val += amp * noise(p * freq);
        freq *= 2.1;
        amp *= 0.45;
      }
      return val;
    }

    void main() {
      vec2 uv = vUv;
      vec2 centered = uv - 0.5;
      float aspect = uResolution.x / uResolution.y;
      vec2 st = vec2(centered.x * aspect, centered.y);

      // Flowing nebula layers
      float t = uTime * 0.08;
      float n1 = fbm(st * 3.5 + vec2(t * 0.3, t * 0.2) + uScroll * 0.3);
      float n2 = fbm(st * 2.0 + vec2(-t * 0.2, t * 0.35) - uScroll * 0.2);
      float n3 = fbm(st * 5.0 + vec2(t * 0.15, -t * 0.25));

      // Mouse influence
      float mouseDist = length(st - uMouse * 0.5);
      float mouseGlow = exp(-mouseDist * 3.5) * 0.25;

      // Color palette
      vec3 purple = vec3(0.45, 0.15, 0.8);
      vec3 deepBlue = vec3(0.05, 0.08, 0.35);
      vec3 cyan = vec3(0.0, 0.55, 0.65);
      vec3 pink = vec3(0.7, 0.15, 0.4);

      vec3 color = deepBlue;
      color = mix(color, purple, n1 * 0.5 + 0.25);
      color = mix(color, cyan, n2 * 0.35);
      color = mix(color, pink, n3 * 0.2);

      // Radial vignette
      float vignette = 1.0 - length(centered) * 1.4;
      vignette = smoothstep(0.0, 0.7, vignette);

      // Mouse glow
      color += purple * mouseGlow * 0.4;
      color += cyan * mouseGlow * 0.2;

      // Subtle grain
      float grain = hash(uv + uTime * 0.01) * 0.04;

      color *= vignette;
      color += grain;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

// ─────────────────────────────────────────────
// GLOW PARTICLE — soft radial glow shader
// ─────────────────────────────────────────────
export const GlowParticleShader = {
  uniforms: {
    uTime: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec3 vPos;
    varying vec3 vNormal;
    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vPos = worldPos.xyz;
      vNormal = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec3 vPos;
    varying vec3 vNormal;
    uniform float uTime;

    void main() {
      vec3 viewDir = normalize(cameraPosition - vPos);
      float fresnel = 1.0 - abs(dot(viewDir, vNormal));
      fresnel = pow(fresnel, 2.5);

      // Pulsing glow
      float pulse = 1.0 + sin(uTime * 2.0 + vPos.y * 3.0) * 0.3;
      float glow = fresnel * 0.7 + 0.3;

      vec3 core = vec3(1.0, 0.9, 1.0);
      vec3 edge = vec3(0.4, 0.2, 0.9);

      vec3 color = mix(edge, core, glow) * pulse;
      float alpha = glow * 0.9;

      gl_FragColor = vec4(color, alpha);
    }
  `,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
};

// ─────────────────────────────────────────────
// SHIMMER SURFACE — iridescent material for geometry
// ─────────────────────────────────────────────
export const ShimmerShader = {
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(0x9966ff) },
    uScroll: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec3 vPos;
    varying vec3 vNormal;
    varying vec2 vUv;
    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vPos = worldPos.xyz;
      vNormal = normalize(mat3(modelMatrix) * normal);
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec3 vPos;
    varying vec3 vNormal;
    varying vec2 vUv;
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uScroll;

    void main() {
      vec3 viewDir = normalize(cameraPosition - vPos);
      float fresnel = 1.0 - abs(dot(viewDir, vNormal));
      fresnel = pow(fresnel, 3.0);

      // Iridescent shimmer
      float shimmer = sin(vPos.x * 8.0 + uTime) * cos(vPos.z * 6.0 + uTime * 0.7)
                    + sin(vPos.y * 10.0 - uTime * 0.5) * 0.5;
      shimmer = shimmer * 0.5 + 0.5;

      vec3 color1 = uColor;
      vec3 color2 = vec3(0.1, 0.7, 0.8);
      vec3 baseColor = mix(color1, color2, shimmer * 0.3);

      // Edge glow
      vec3 edgeGlow = mix(color1, vec3(1.0, 0.8, 1.0), fresnel);
      vec3 color = mix(baseColor, edgeGlow, fresnel * 0.7);

      // Subtle specular
      float spec = pow(max(dot(viewDir, reflect(vec3(0.0, 0.0, -1.0), vNormal)), 0.0), 32.0);
      color += spec * 0.25;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

// ─────────────────────────────────────────────
// ENERGY RING — emissive ring shader
// ─────────────────────────────────────────────
export const EnergyRingShader = {
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(0x22d3ee) },
    uIntensity: { value: 1.0 },
  },
  vertexShader: /* glsl */ `
    varying vec3 vPos;
    varying vec3 vNormal;
    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vPos = worldPos.xyz;
      vNormal = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec3 vPos;
    varying vec3 vNormal;
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uIntensity;

    void main() {
      vec3 viewDir = normalize(cameraPosition - vPos);
      float fresnel = 1.0 - abs(dot(viewDir, vNormal));

      float pulse = 1.0 + sin(uTime * 3.0 + vPos.x * 5.0) * 0.15;
      float glow = pow(fresnel, 1.5) * uIntensity * pulse;

      vec3 color = uColor * glow;
      float alpha = glow * 0.8;

      gl_FragColor = vec4(color, alpha);
    }
  `,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
};

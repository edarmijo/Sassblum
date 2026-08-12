import { useEffect, useRef } from 'react';
import {
  WebGLRenderer, Scene, PerspectiveCamera,
  BufferGeometry, BufferAttribute, Points,
  ShaderMaterial, LineSegments, LineBasicMaterial,
  TorusGeometry, SphereGeometry, Mesh,
  MeshBasicMaterial, Clock, Vector2,
  AdditiveBlending, DoubleSide, DynamicDrawUsage,
} from 'three';
import { secureRandom } from '../utils/random';

/**
 * ThreeBackground — Full-screen fixed Three.js canvas.
 *
 * Architecture:
 *  • Particle drift lives entirely on the GPU: initial positions are static
 *    (uploaded once); the vertex shader computes pos = initPos + aVelocity × uTime.
 *    Zero CPU→GPU buffer transfers per frame for particles.
 *  • Line network uses a dedicated cpuPositions buffer that mirrors the same
 *    drift formula, keeping line connections visually accurate without touching
 *    the GPU-side particle buffer.
 *  • Connecting lines run a spatial grid-hash (O(n)) every 3rd frame.
 *  • Respects prefers-reduced-motion: one static frame then stops.
 */

/* ───────── constants ───────── */
const PARTICLE_COUNT_DESKTOP = 560;
const PARTICLE_COUNT_MOBILE  = 300;
const FRAME_INTERVAL_MS = 1000 / 30;
const MOUSE_LERP  = 0.05;
const CAMERA_LERP = 0.02;
const ORB_LERP    = 0.03;
const MAX_RENDER_PIXELS = 4_000_000;
const MAX_PIXEL_RATIO = 1.75;

function optimizedPixelRatio(width: number, height: number): number {
  const budgetRatio = Math.sqrt(MAX_RENDER_PIXELS / Math.max(1, width * height));
  return Math.max(0.75, Math.min(globalThis.window.devicePixelRatio, MAX_PIXEL_RATIO, budgetRatio));
}

/* ───────── vertex shader ───────── */
// 'position' holds the INITIAL (static) position.
// Drift is computed here: finalDrift = position + aVelocity * uTime, wrapped to [-10,10].
const particleVertexShader = /* glsl */ `
  uniform float uTime;
  uniform vec2  uMouse;
  attribute float aScale;
  attribute float aRandom;
  attribute vec3  aVelocity;
  varying float vDist;
  varying float vAlpha;

  void main() {
    // GPU drift: deterministic from initial position + velocity × time
    vec3 pos = position + aVelocity * uTime;
    // wrap XY to [-10, 10] — matches the CPU wrap used for line connections
    pos.x = mod(pos.x + 10.0, 20.0) - 10.0;
    pos.y = mod(pos.y + 10.0, 20.0) - 10.0;

    // anti-gravity oscillation on top of drift
    pos.y += sin(uTime * 0.4 + aRandom * 6.2831) * 0.5;
    pos.x += cos(uTime * 0.3 + aRandom * 6.2831) * 0.35;
    pos.z += sin(uTime * 0.2 + aRandom * 3.1416) * 0.25;

    // mouse repulsion in XZ plane
    vec2 diff = pos.xz - uMouse;
    float dist  = length(diff);
    float force = smoothstep(3.0, 0.0, dist) * 1.5;
    pos.xz += normalize(diff + 0.0001) * force;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position  = projectionMatrix * mvPos;
    gl_PointSize = aScale * (200.0 / -mvPos.z);

    vDist  = dist;
    vAlpha = 0.3 + 0.7 * aScale;
  }
`;

/* ───────── fragment shader — teal/cyan brand colors ───────── */
const particleFragmentShader = /* glsl */ `
  uniform float uTime;
  varying float vDist;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float glow = pow(1.0 - smoothstep(0.0, 0.5, d), 1.5);

    vec3 teal  = vec3(0.0, 0.769, 0.878);   // #00c4e0
    vec3 cyan  = vec3(0.220, 0.851, 0.961);  // #38d9f5
    float mix_t = sin(uTime * 0.5 + vDist * 0.3) * 0.5 + 0.5;
    vec3 color  = mix(teal, cyan, mix_t);

    gl_FragColor = vec4(color, glow * vAlpha * 0.55);
  }
`;

/* ───────── orb shaders ───────── */
const orbVertexShader = /* glsl */ `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    float breathe = 1.0 + sin(uTime * 0.8 + position.y * 3.0) * 0.05;
    vec3 pos = position * breathe;
    vNormal  = normalize(normalMatrix * normal);
    vec4 mv  = modelViewMatrix * vec4(pos, 1.0);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const orbFragmentShader = /* glsl */ `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    float fresnel = pow(1.0 - abs(dot(vNormal, vViewDir)), 3.0);
    vec3 core  = vec3(0.0, 0.769, 0.878);
    vec3 rim   = vec3(0.220, 0.851, 0.961);
    vec3 color = mix(core, rim, fresnel);
    float alpha = (fresnel * 0.4 + 0.05) + sin(uTime * 1.5) * 0.02;
    gl_FragColor = vec4(color, alpha);
  }
`;

/* ───────── component ───────── */
export function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isMobile       = globalThis.window.innerWidth < 768;
    const PARTICLE_COUNT = isMobile ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP;

    /* ── renderer ── */
    const viewportPixels = globalThis.window.innerWidth * globalThis.window.innerHeight;
    const renderer = new WebGLRenderer({ alpha: true, antialias: !isMobile && viewportPixels <= 2_500_000 });
    renderer.setSize(globalThis.window.innerWidth, globalThis.window.innerHeight);
    renderer.setPixelRatio(optimizedPixelRatio(globalThis.window.innerWidth, globalThis.window.innerHeight));
    Object.assign(renderer.domElement.style, {
      position: 'fixed', top: '0', left: '0',
      width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: '0',
    });
    containerRef.current?.appendChild(renderer.domElement);

    /* ── scene & camera ── */
    const scene  = new Scene();
    const camera = new PerspectiveCamera(
      75, globalThis.window.innerWidth / globalThis.window.innerHeight, 0.1, 1000,
    );
    camera.position.z = 5;

    /* ── smooth mouse state ── */
    const mouseTarget = { x: 0, y: 0 };
    const mouseSmooth = { x: 0, y: 0 };

    const onMouseMove = (e: MouseEvent) => {
      mouseTarget.x =  (e.clientX / globalThis.window.innerWidth)  * 2 - 1;
      mouseTarget.y = -(e.clientY / globalThis.window.innerHeight) * 2 + 1;
    };
    globalThis.addEventListener('mousemove', onMouseMove, { passive: true });

    /* ── particle buffers ── */
    const geo           = new BufferGeometry();
    const initPositions = new Float32Array(PARTICLE_COUNT * 3); // static, never mutated
    const velocities    = new Float32Array(PARTICLE_COUNT * 3); // static attribute
    const scales        = new Float32Array(PARTICLE_COUNT);
    const randoms       = new Float32Array(PARTICLE_COUNT);
    const cpuPositions  = new Float32Array(PARTICLE_COUNT * 3); // mirrors GPU drift for lines

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      initPositions[i3]     = (secureRandom() - 0.5) * 20;
      initPositions[i3 + 1] = (secureRandom() - 0.5) * 20;
      initPositions[i3 + 2] = (secureRandom() - 0.5) * 15;
      velocities[i3]     = (secureRandom() - 0.5) * 0.005;
      velocities[i3 + 1] = (secureRandom() - 0.5) * 0.005;
      velocities[i3 + 2] = (secureRandom() - 0.5) * 0.003;
      scales[i]  = secureRandom() * 3 + 0.5;
      randoms[i] = secureRandom();
    }

    // All particle attributes are static — uploaded once, never updated
    geo.setAttribute('position',  new BufferAttribute(initPositions, 3));
    geo.setAttribute('aVelocity', new BufferAttribute(velocities, 3));
    geo.setAttribute('aScale',    new BufferAttribute(scales, 1));
    geo.setAttribute('aRandom',   new BufferAttribute(randoms, 1));

    const particleUniforms = {
      uTime:  { value: 0 },
      uMouse: { value: new Vector2(0, 0) },
    };

    const particleMat = new ShaderMaterial({
      vertexShader:   particleVertexShader,
      fragmentShader: particleFragmentShader,
      uniforms:       particleUniforms,
      transparent: true,
      depthWrite:  false,
      blending:    AdditiveBlending,
    });

    const particles = new Points(geo, particleMat);
    scene.add(particles);

    /* ── connecting lines (DynamicDrawUsage: updated every 3 frames) ── */
    const lineCount = Math.floor(PARTICLE_COUNT * 0.06);
    const lineGeo   = new BufferGeometry();
    const linePos   = new Float32Array(lineCount * 6);
    const linePosAttr = new BufferAttribute(linePos, 3);
    linePosAttr.usage = DynamicDrawUsage;
    lineGeo.setAttribute('position', linePosAttr);
    const lineMat = new LineBasicMaterial({
      color: 0x38d9f5, transparent: true, opacity: 0.12,
      blending: AdditiveBlending,
    });
    const lines = new LineSegments(lineGeo, lineMat);
    scene.add(lines);

    /* ── torus rings ── */
    const ring1 = new Mesh(
      new TorusGeometry(3, 0.02, 16, 60),
      new MeshBasicMaterial({ color: 0x00c4e0, transparent: true, opacity: 0.09 }),
    );
    ring1.rotation.x = Math.PI * 0.3;
    scene.add(ring1);

    const ring2Mat = new MeshBasicMaterial({ color: 0x38d9f5, transparent: true, opacity: 0.06 });
    const ring2 = new Mesh(new TorusGeometry(3.9, 0.015, 16, 60), ring2Mat);
    ring2.rotation.x = Math.PI * 0.6;
    ring2.rotation.y = Math.PI * 0.3;
    scene.add(ring2);

    /* ── central orb ── */
    const orbMat = new ShaderMaterial({
      vertexShader:   orbVertexShader,
      fragmentShader: orbFragmentShader,
      uniforms:       { uTime: { value: 0 } },
      transparent: true, depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
    });
    const orb = new Mesh(new SphereGeometry(0.8, 24, 24), orbMat);
    scene.add(orb);

    /* ── connecting-line update — spatial grid hash O(n) ── */
    const maxDist   = 1.8;
    const maxDistSq = maxDist * maxDist;
    const CELL      = maxDist;
    const lineLimit = lineCount * 6;

    /** Sync cpuPositions with the GPU drift formula (no oscillation — same as before) */
    function syncCpuPositions(elapsed: number) {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        const rawX = initPositions[i3]     + velocities[i3]     * elapsed;
        const rawY = initPositions[i3 + 1] + velocities[i3 + 1] * elapsed;
        const phase = randoms[i] * Math.PI * 2;
        let x = ((rawX + 10) % 20 + 20) % 20 - 10;
        const y = ((rawY + 10) % 20 + 20) % 20 - 10
          + Math.sin(elapsed * 0.4 + phase) * 0.5;
        let z = initPositions[i3 + 2] + velocities[i3 + 2] * elapsed
          + Math.sin(elapsed * 0.2 + randoms[i] * Math.PI) * 0.25;
        x += Math.cos(elapsed * 0.3 + phase) * 0.35;

        const dx = x - mouseSmooth.x * 5;
        const dz = z - mouseSmooth.y * 4;
        const distance = Math.hypot(dx, dz);
        const t = Math.max(0, Math.min(1, 1 - distance / 3));
        const force = t * t * (3 - 2 * t) * 1.5;
        const length = Math.hypot(dx + 0.0001, dz + 0.0001) || 1;
        x += ((dx + 0.0001) / length) * force;
        z += ((dz + 0.0001) / length) * force;

        cpuPositions[i3] = x;
        cpuPositions[i3 + 1] = y;
        cpuPositions[i3 + 2] = z;
      }
    }

    /** Build 2D spatial grid (XY) — each cell holds particle indices */
    function buildGrid(): Map<string, number[]> {
      const grid = new Map<string, number[]>();
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const cx = Math.floor(cpuPositions[i * 3]     / CELL);
        const cy = Math.floor(cpuPositions[i * 3 + 1] / CELL);
        const k  = `${cx},${cy}`;
        let bucket = grid.get(k);
        if (!bucket) { bucket = []; grid.set(k, bucket); }
        bucket.push(i);
      }
      return grid;
    }

    /** Write line segments for close pairs between two buckets; returns next idx. */
    function connectBuckets(bucket: number[], neighbors: number[], lp: Float32Array, idx: number): number {
      for (const i of bucket) {
        const i3 = i * 3;
        for (const j of neighbors) {
          if (j <= i) continue;
          if (idx >= lineLimit) return idx;
          const j3 = j * 3;
          const dx = cpuPositions[i3]     - cpuPositions[j3];
          const dy = cpuPositions[i3 + 1] - cpuPositions[j3 + 1];
          const dz = cpuPositions[i3 + 2] - cpuPositions[j3 + 2];
          if (dx * dx + dy * dy + dz * dz < maxDistSq) {
            lp[idx++] = cpuPositions[i3];   lp[idx++] = cpuPositions[i3 + 1]; lp[idx++] = cpuPositions[i3 + 2];
            lp[idx++] = cpuPositions[j3];   lp[idx++] = cpuPositions[j3 + 1]; lp[idx++] = cpuPositions[j3 + 2];
          }
        }
      }
      return idx;
    }

    /** Scan each cell against its 3×3 neighborhood; returns segments written. */
    function writeSegments(grid: Map<string, number[]>, lp: Float32Array): number {
      let idx = 0;
      for (const [key, bucket] of grid) {
        const comma = key.indexOf(',');
        const cx = +key.slice(0, comma);
        const cy = +key.slice(comma + 1);
        for (let di = -1; di <= 1; di++) {
          for (let dj = -1; dj <= 1; dj++) {
            const neighbors = grid.get(`${cx + di},${cy + dj}`);
            if (!neighbors) continue;
            idx = connectBuckets(bucket, neighbors, lp, idx);
            if (idx >= lineLimit) return idx;
          }
        }
      }
      return idx;
    }

    function updateLines(elapsed: number) {
      syncCpuPositions(elapsed);
      const lp = lineGeo.attributes.position.array as Float32Array;
      const idx = writeSegments(buildGrid(), lp);
      for (let k = idx; k < lineLimit; k++) lp[k] = 0;
      lineGeo.attributes.position.needsUpdate = true;
    }

    /* ── animation loop ── */
    let rafId      = 0;
    let frameCount = 0;
    let lastFrameMs = 0;
    let running = false;
    let prevCamX   = 0;   // skip lookAt when camera barely moved
    const clock    = new Clock();

    function animate(now = 0) {
      if (!running) return;
      rafId = requestAnimationFrame(animate);
      if (now - lastFrameMs < FRAME_INTERVAL_MS) return;
      lastFrameMs = now;
      frameCount++;
      const elapsed = clock.getElapsedTime();

      // smooth mouse
      mouseSmooth.x += (mouseTarget.x - mouseSmooth.x) * MOUSE_LERP;
      mouseSmooth.y += (mouseTarget.y - mouseSmooth.y) * MOUSE_LERP;

      // uniforms (uTime drives particle drift + oscillation + orb breathe)
      particleUniforms.uTime.value  = elapsed;
      particleUniforms.uMouse.value.set(mouseSmooth.x * 5, mouseSmooth.y * 4);
      orbMat.uniforms.uTime.value   = elapsed;

      // orb follows mouse
      orb.position.x += (mouseSmooth.x * 0.8 - orb.position.x) * ORB_LERP;
      orb.position.y += (mouseSmooth.y * 0.5 - orb.position.y) * ORB_LERP;

      // ring orbits
      ring1.rotation.z =  elapsed * 0.05;
      ring2.rotation.z = -elapsed * 0.03;

      // camera follows mouse; skip matrix rebuild when movement is negligible
      camera.position.x += (mouseSmooth.x * 0.3 - camera.position.x) * CAMERA_LERP;
      camera.position.y += (mouseSmooth.y * 0.2 - camera.position.y) * CAMERA_LERP;
      if (Math.abs(camera.position.x - prevCamX) > 0.0001) {
        camera.lookAt(0, 0, 0);
        prevCamX = camera.position.x;
      }

      // slow whole-particle-cloud rotation
      particles.rotation.y = elapsed * 0.02;

      // line network: Hz-independent throttle + O(n) grid hash
      if (frameCount % 2 === 0) updateLines(elapsed);

      renderer.render(scene, camera);
    }

    // Respect prefers-reduced-motion
    const prefersReducedMotion = globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      renderer.render(scene, camera);
    } else {
      running = true;
      rafId = requestAnimationFrame(animate);
    }

    /* ── pause when tab is hidden ── */
    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(rafId);
      } else if (!prefersReducedMotion && !running) {
        running = true;
        rafId = requestAnimationFrame(animate);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    /* ── resize ── */
    const onResize = () => {
      camera.aspect = globalThis.window.innerWidth / globalThis.window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(globalThis.window.innerWidth, globalThis.window.innerHeight);
      renderer.setPixelRatio(optimizedPixelRatio(globalThis.window.innerWidth, globalThis.window.innerHeight));
    };
    globalThis.addEventListener('resize', onResize, { passive: true });

    /* ── cleanup ── */
    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', onVisibility);
      globalThis.removeEventListener('mousemove', onMouseMove);
      globalThis.removeEventListener('resize',    onResize);
      geo.dispose();       particleMat.dispose();
      lineGeo.dispose();   lineMat.dispose();
      ring1.geometry.dispose(); ring1.material.dispose();
      ring2.geometry.dispose(); ring2Mat.dispose();
      orb.geometry.dispose();   orbMat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  );
}

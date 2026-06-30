/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from 'react';

/**
 * ThreeBackground — Full-screen fixed Three.js canvas.
 * Matches scripts.js reference exactly:
 *  • CPU velocity-based particle drift (same as initThreeBackground)
 *  • Shader float + mouse repulsion
 *  • Camera follows mouse
 *  • Two orbiting torus rings
 *  • Central glowing orb (Fresnel)
 *  • Connecting line network (throttled every 3rd frame)
 *
 * Relies on THREE loaded via CDN in index.html.
 * NOTE: No prefers-reduced-motion gate — always animates (same as reference).
 */

/* ───────── constants ───────── */
const PARTICLE_COUNT_DESKTOP = 1500;
const PARTICLE_COUNT_MOBILE  = 600;
const MOUSE_LERP       = 0.05;
const CAMERA_LERP      = 0.02;
const ORB_LERP         = 0.03;

/* ───────── vertex shader ───────── */
const particleVertexShader = /* glsl */ `
  uniform float uTime;
  uniform vec2  uMouse;
  attribute float aScale;
  attribute float aRandom;
  varying float vDist;
  varying float vAlpha;

  void main() {
    vec3 pos = position;

    // anti-gravity float (oscillation on top of CPU drift)
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

    // SassBlum teal palette
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
    vec3 core  = vec3(0.0, 0.769, 0.878);   // teal core
    vec3 rim   = vec3(0.220, 0.851, 0.961);  // cyan rim
    vec3 color = mix(core, rim, fresnel);
    float alpha = (fresnel * 0.4 + 0.05) + sin(uTime * 1.5) * 0.02;
    gl_FragColor = vec4(color, alpha);
  }
`;

/* ───────── component ───────── */
export function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const THREE = (window as Record<string, any>).THREE;
    if (!THREE) {
      console.warn('[ThreeBackground] THREE not on window — CDN not loaded yet?');
      return;
    }

    const isMobile      = window.innerWidth < 768;
    const PARTICLE_COUNT = isMobile ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP;

    /* ── renderer ── */
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !isMobile });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    Object.assign(renderer.domElement.style, {
      position: 'fixed', top: '0', left: '0',
      width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: '0',
    });
    containerRef.current?.appendChild(renderer.domElement);

    /* ── scene & camera ── */
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    /* ── smooth mouse state ── */
    const mouseTarget = { x: 0, y: 0 };
    const mouseSmooth = { x: 0, y: 0 };

    const onMouseMove = (e: MouseEvent) => {
      mouseTarget.x = (e.clientX / window.innerWidth)  * 2 - 1;
      mouseTarget.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    /* ── particles ── */
    const geo       = new THREE.BufferGeometry();
    const positions  = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);   // CPU drift
    const scales     = new Float32Array(PARTICLE_COUNT);
    const randoms    = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      positions[i3]     = (Math.random() - 0.5) * 20;
      positions[i3 + 1] = (Math.random() - 0.5) * 20;
      positions[i3 + 2] = (Math.random() - 0.5) * 15;
      // same velocity range as reference scripts.js
      velocities[i3]     = (Math.random() - 0.5) * 0.005;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.005;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.003;
      scales[i]  = Math.random() * 3 + 0.5;
      randoms[i] = Math.random();
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aScale',   new THREE.BufferAttribute(scales, 1));
    geo.setAttribute('aRandom',  new THREE.BufferAttribute(randoms, 1));

    const particleUniforms = {
      uTime:  { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
    };

    const particleMat = new THREE.ShaderMaterial({
      vertexShader:   particleVertexShader,
      fragmentShader: particleFragmentShader,
      uniforms:       particleUniforms,
      transparent: true,
      depthWrite:  false,
      blending:    THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geo, particleMat);
    scene.add(particles);

    /* ── connecting lines ── */
    const lineCount = Math.floor(PARTICLE_COUNT * 0.06);
    const lineGeo   = new THREE.BufferGeometry();
    const linePos   = new Float32Array(lineCount * 6);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
    const lineMat   = new THREE.LineBasicMaterial({
      color: 0x38d9f5, transparent: true, opacity: 0.12,
      blending: THREE.AdditiveBlending,
    });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    /* ── torus rings ── */
    const ring1 = new THREE.Mesh(
      new THREE.TorusGeometry(3, 0.02, 16, 100),
      new THREE.MeshBasicMaterial({ color: 0x00c4e0, transparent: true, opacity: 0.09 }),
    );
    ring1.rotation.x = Math.PI * 0.3;
    scene.add(ring1);

    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x38d9f5, transparent: true, opacity: 0.06 });
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.9, 0.015, 16, 100), ring2Mat);
    ring2.rotation.x = Math.PI * 0.6;
    ring2.rotation.y = Math.PI * 0.3;
    scene.add(ring2);

    /* ── central orb ── */
    const orbMat = new THREE.ShaderMaterial({
      vertexShader:   orbVertexShader,
      fragmentShader: orbFragmentShader,
      uniforms:       { uTime: { value: 0 } },
      transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.8, 64, 64), orbMat);
    scene.add(orb);

    /* ── connecting-line update ── */
    function updateLines() {
      const pos = geo.attributes.position.array as Float32Array;
      const lp  = lineGeo.attributes.position.array as Float32Array;
      const maxDist = 1.8;
      let idx = 0;
      outer: for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        for (let j = i + 1; j < PARTICLE_COUNT; j++) {
          if (idx >= lineCount * 6) break outer;
          const j3 = j * 3;
          const dx = pos[i3] - pos[j3], dy = pos[i3+1] - pos[j3+1], dz = pos[i3+2] - pos[j3+2];
          if (Math.sqrt(dx*dx + dy*dy + dz*dz) < maxDist) {
            lp[idx++] = pos[i3];   lp[idx++] = pos[i3+1]; lp[idx++] = pos[i3+2];
            lp[idx++] = pos[j3];   lp[idx++] = pos[j3+1]; lp[idx++] = pos[j3+2];
          }
        }
      }
      for (let k = idx; k < lineCount * 6; k++) lp[k] = 0;
      lineGeo.attributes.position.needsUpdate = true;
    }

    /* ── animation loop (always runs — no prefers-reduced-motion gate) ── */
    let rafId = 0;
    const clock = new THREE.Clock();

    function animate() {
      rafId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // smooth mouse (same as reference)
      mouseSmooth.x += (mouseTarget.x - mouseSmooth.x) * MOUSE_LERP;
      mouseSmooth.y += (mouseTarget.y - mouseSmooth.y) * MOUSE_LERP;

      // uniforms
      particleUniforms.uTime.value  = elapsed;
      particleUniforms.uMouse.value.set(mouseSmooth.x * 5, mouseSmooth.y * 4);
      orbMat.uniforms.uTime.value   = elapsed;

      // orb follows mouse
      orb.position.x += (mouseSmooth.x * 0.8 - orb.position.x) * ORB_LERP;
      orb.position.y += (mouseSmooth.y * 0.5 - orb.position.y) * ORB_LERP;

      // ring orbits
      ring1.rotation.z = elapsed * 0.05;
      ring2.rotation.z = -elapsed * 0.03;

      // camera follows mouse (same as reference)
      camera.position.x += (mouseSmooth.x * 0.3 - camera.position.x) * CAMERA_LERP;
      camera.position.y += (mouseSmooth.y * 0.2 - camera.position.y) * CAMERA_LERP;
      camera.lookAt(0, 0, 0);

      // CPU particle drift (same as reference — velocities + wrap-around)
      const posArr = geo.attributes.position.array as Float32Array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        posArr[i3]     += velocities[i3];
        posArr[i3 + 1] += velocities[i3 + 1];
        posArr[i3 + 2] += velocities[i3 + 2];
        if (posArr[i3]     >  10) posArr[i3]     = -10;
        if (posArr[i3]     < -10) posArr[i3]     =  10;
        if (posArr[i3 + 1] >  10) posArr[i3 + 1] = -10;
        if (posArr[i3 + 1] < -10) posArr[i3 + 1] =  10;
      }
      geo.attributes.position.needsUpdate = true;

      // slow whole-particle-cloud rotation
      particles.rotation.y = elapsed * 0.02;

      // connecting lines (every 3rd frame)
      if (Math.floor(elapsed * 60) % 3 === 0) updateLines();

      renderer.render(scene, camera);
    }

    animate();   // ← always starts (no prefers-reduced-motion gate)

    /* ── resize ── */
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize, { passive: true });

    /* ── cleanup ── */
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize',    onResize);
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

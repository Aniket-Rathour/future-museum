"use client";
// Futuristic layer for the island: anti-gravity core, energy rings, holographic orbit, hologram, drones, rim light.
// Purely additive: lives inside the island group so it floats and rotates with it. Glows brighten at night.
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { cam } from "@/lib/data";

const CYAN = new THREE.Color("#7ff3ff");

let glowTex;
function glow() {
  if (glowTex) return glowTex;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d"), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,.45)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  return (glowTex = new THREE.CanvasTexture(c));
}

const additive = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false };

function Halo({ scale, color = CYAN, opacity = 0.8, ...props }) {
  return (
    <sprite scale={scale} {...props}>
      <spriteMaterial map={glow()} color={color} opacity={opacity} {...additive} />
    </sprite>
  );
}

// Dashed holographic ring: dashes scroll around, a bright scan sweeps once per lap.
const RING_FRAG = /* glsl */ `
uniform float uTime, uGain; uniform vec3 uColor; varying vec2 vUv;
void main(){
  float a = vUv.x;
  float dash = step(.35, fract(a * 90. - uTime * .6));
  float scan = pow(1. - fract(a - uTime * .07), 18.);
  float edge = smoothstep(0., .3, vUv.y) * smoothstep(1., .7, vUv.y);
  vec3 c = uColor * (dash * .35 + scan * 2.) * edge * uGain;
  gl_FragColor = vec4(c, clamp(max(c.r, max(c.g, c.b)), 0., 1.));
}`;
const RING_VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;

// Beam: brightest at the source (uv.y = 1), fading away, soft at the silhouette.
const BEAM_FRAG = /* glsl */ `
uniform float uTime, uGain; uniform vec3 uColor; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
void main(){
  float f = pow(abs(dot(vN, vV)), 2.);
  float flow = .75 + .25 * sin(vUv.y * 40. + uTime * 6.);
  vec3 c = uColor * f * pow(vUv.y, 2.) * flow * uGain;
  gl_FragColor = vec4(c, clamp(max(c.r, max(c.g, c.b)), 0., 1.));
}`;
const BEAM_VERT = /* glsl */ `
varying vec2 vUv; varying vec3 vN; varying vec3 vV;
void main(){
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.);
  vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;

function shader(frag, vert, gain) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uGain: { value: gain }, uColor: { value: CYAN.clone() } },
    vertexShader: vert, fragmentShader: frag, side: THREE.DoubleSide, transparent: true, depthWrite: false, toneMapped: false,
    // the canvas is transparent over the CSS sky, so add light in both colour and alpha (premultiplied)
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
  });
}

function Core() {
  const crystal = useRef(), rings = useRef(), halo = useRef();
  const beam = useMemo(() => shader(BEAM_FRAG, BEAM_VERT, 0.7), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime, pulse = 0.85 + Math.sin(t * 2.2) * 0.15, n = 1 + cam.night * 1.2;
    crystal.current.rotation.y = t * 0.6;
    crystal.current.material.emissiveIntensity = 3 * pulse * n;
    rings.current.children.forEach((r, i) => { r.rotation.x = t * (0.4 + i * 0.25); r.rotation.y = t * (0.3 - i * 0.2); });
    halo.current.material.opacity = 0.65 * pulse * n;
    beam.uniforms.uTime.value = t;
    beam.uniforms.uGain.value = 0.55 * n;
  });
  return (
    <group position={[0, -4.75, 0]}>
      <mesh ref={crystal} scale={[0.42, 0.75, 0.42]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#cffbff" emissive="#4fe3ff" metalness={0.2} roughness={0.1} toneMapped={false} />
      </mesh>
      <group ref={rings}>
        {[0.85, 1.15, 1.45].map((r) => (
          <mesh key={r}>
            <torusGeometry args={[r, 0.012, 8, 128]} />
            <meshBasicMaterial color="#9ff6ff" {...additive} opacity={0.9} />
          </mesh>
        ))}
      </group>
      <Halo ref={halo} scale={[3.4, 3.4, 1]} />
      {/* anti-gravity thrust fading into the clouds */}
      <mesh material={beam} position={[0, -1.7, 0]}><cylinderGeometry args={[0.3, 0.9, 3.2, 40, 1, true]} /></mesh>
      <pointLight color="#6fe7ff" intensity={8} distance={7} />
    </group>
  );
}

function OrbitRings() {
  const g = useRef();
  const mats = useMemo(() => [shader(RING_FRAG, RING_VERT, 0.9), shader(RING_FRAG, RING_VERT, 0.6)], []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    mats.forEach((m) => { m.uniforms.uTime.value = t; m.uniforms.uGain.value = (m === mats[0] ? 0.9 : 0.6) * (1 + cam.night); });
    g.current.children[0].rotation.z = t * 0.05;
    g.current.children[1].rotation.z = -t * 0.03;
  });
  return (
    <group ref={g}>
      <mesh material={mats[0]} rotation={[Math.PI / 2 - 0.12, 0, 0]} position={[0, -0.6, 0]}><ringGeometry args={[4.55, 4.6, 256, 1]} /></mesh>
      <mesh material={mats[1]} rotation={[Math.PI / 2 + 0.18, 0.1, 0]} position={[0, -1.4, 0]}><ringGeometry args={[5.15, 5.19, 256, 1]} /></mesh>
    </group>
  );
}

function Hologram() {
  const g = useRef();
  const beam = useMemo(() => shader(BEAM_FRAG, BEAM_VERT, 0.35), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    g.current.rotation.y = t * 0.5;
    g.current.position.y = 4.45 + Math.sin(t * 1.3) * 0.06;
    beam.uniforms.uTime.value = t;
  });
  return (
    <group position={[0, 0, -0.95]}>
      <group ref={g}>
        <mesh>
          <icosahedronGeometry args={[0.32, 1]} />
          <meshBasicMaterial color="#9ff6ff" wireframe {...additive} opacity={0.85} />
        </mesh>
        <mesh scale={0.55}>
          <icosahedronGeometry args={[0.32, 0]} />
          <meshBasicMaterial color="#e8fdff" {...additive} opacity={0.6} />
        </mesh>
        <Halo scale={[1.4, 1.4, 1]} opacity={0.45} />
      </group>
      {/* projector cone from the rotor hub up to the hologram */}
      <mesh material={beam} position={[0, 4.0, 0]} rotation-x={Math.PI}><cylinderGeometry args={[0.04, 0.32, 0.7, 24, 1, true]} /></mesh>
    </group>
  );
}

function Drones() {
  const refs = useRef([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    refs.current.forEach((d, i) => {
      const a = t * (0.18 + i * 0.04) + i * 2.1, rad = 4.1 + i * 0.3;
      d.position.set(Math.cos(a) * rad, 1.4 + i * 0.5 + Math.sin(t * 0.9 + i) * 0.15, Math.sin(a) * rad);
      d.rotation.y = -a;
    });
  });
  return [0, 1, 2].map((i) => (
    <group key={i} ref={(o) => (refs.current[i] = o)}>
      <mesh rotation-z={Math.PI / 2}>
        <capsuleGeometry args={[0.06, 0.18, 6, 12]} />
        <meshStandardMaterial color="#e9edf3" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, -0.065, 0]} rotation-x={Math.PI / 2}>
        <circleGeometry args={[0.05, 20]} />
        <meshBasicMaterial color="#9ff6ff" toneMapped={false} />
      </mesh>
      <Halo position={[0, -0.09, 0]} scale={[0.45, 0.45, 1]} opacity={0.7} />
    </group>
  ));
}

export default function Futurism() {
  const rim = useRef();
  useFrame(({ clock }) => (rim.current.material.opacity = (0.45 + Math.sin(clock.elapsedTime * 1.5) * 0.1) * (1 + cam.night)));
  return (
    <>
      <Core />
      <OrbitRings />
      <Hologram />
      <Drones />
      {/* thin light strip under the soil rim */}
      <mesh ref={rim} position={[0, -0.24, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[3.66, 0.014, 8, 256]} />
        <meshBasicMaterial color="#9ff6ff" {...additive} />
      </mesh>
    </>
  );
}

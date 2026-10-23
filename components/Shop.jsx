"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshReflectorMaterial, Sparkles, useTexture } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { products, shop } from "@/lib/data";

export const GAP = 5;
const lerp = THREE.MathUtils.lerp;

// Photo card: rounded corners, dims when out of focus, a slow light sweep and a thin glowing rim in the product colour.
const CARD_VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const CARD_FRAG = /* glsl */ `
uniform sampler2D uMap; uniform float uTime, uAspect, uFocus; uniform vec3 uColor; varying vec2 vUv;
float rbox(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - r; }
void main(){
  vec2 p = (vUv - .5) * vec2(uAspect, 1.);
  float d = rbox(p, vec2(uAspect * .5, .5), .05);
  float a = smoothstep(.003, -.003, d);
  vec3 col = texture2D(uMap, vUv).rgb * mix(.35, 1.05, uFocus);
  float sweep = fract(uTime * .1) * 2.4 - .7;
  col += smoothstep(.1, 0., abs((vUv.x + vUv.y) * .5 - sweep)) * .22 * uFocus;
  float rim = smoothstep(-.03, -.012, d) * smoothstep(.0, -.008, d);
  col = mix(col, uColor * 2.2, rim * (.4 + .6 * uFocus));
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}`;

// Volumetric-looking spotlight cone: brightest at the lamp, soft at the silhouette, gently flickering.
const BEAM_VERT = /* glsl */ `
varying vec2 vUv; varying vec3 vN; varying vec3 vV;
void main(){
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.);
  vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const BEAM_FRAG = /* glsl */ `
uniform vec3 uColor; uniform float uOpacity, uTime; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
void main(){
  float f = pow(abs(dot(vN, vV)), 2.2);
  float along = pow(vUv.y, 1.6);
  float dust = .85 + .15 * sin(uTime * 1.7 + vUv.x * 40.) * sin(uTime * 1.1 + vUv.y * 25.);
  gl_FragColor = vec4(uColor * f * f * along * dust * uOpacity * .28, 1.);
}`;

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d"), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function archShape(w, h) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(-w / 2, h - w / 2);
  s.absarc(0, h - w / 2, w / 2, Math.PI, 0, true);
  s.lineTo(w / 2, 0);
  s.closePath();
  return s;
}

function Exhibit({ p, i, glow, arch }) {
  const tex = useTexture(p.img);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const aspect = tex.image.width / tex.image.height;
  const H = 3.3;
  const color = useMemo(() => new THREE.Color(p.color), [p.color]);
  const card = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uMap: { value: tex }, uTime: { value: 0 }, uAspect: { value: aspect }, uFocus: { value: 0 }, uColor: { value: color } },
    vertexShader: CARD_VERT, fragmentShader: CARD_FRAG, transparent: true,
  }), [tex, aspect, color]);
  const beam = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uColor: { value: color }, uOpacity: { value: 0 }, uTime: { value: 0 } },
    vertexShader: BEAM_VERT, fragmentShader: BEAM_FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  }), [color]);
  const target = useMemo(() => new THREE.Object3D(), []);
  const g = useRef(), pool = useRef(), light = useRef();

  useFrame(({ camera, pointer, clock }) => {
    const t = clock.elapsedTime;
    const cx = camera.position.x - shop.off;
    const f = 1 - Math.min(Math.abs(cx - i * GAP) / GAP, 1); // 1 = in focus
    const u = card.uniforms;
    u.uTime.value = t;
    u.uFocus.value = lerp(u.uFocus.value, f, 0.08);
    beam.uniforms.uTime.value = t;
    beam.uniforms.uOpacity.value = (0.3 + 0.7 * f) * shop.enter;
    g.current.rotation.y = lerp(g.current.rotation.y, (cx - i * GAP) * 0.1 + pointer.x * 0.22 * f, 0.08);
    g.current.rotation.x = lerp(g.current.rotation.x, -pointer.y * 0.12 * f, 0.08);
    g.current.position.y = lerp(g.current.position.y, (1 - shop.enter) * -5.5 + Math.sin(t * 1.2 + i) * 0.06 + f * 0.1, 0.08);
    g.current.scale.setScalar(lerp(g.current.scale.x, 0.84 + 0.16 * f, 0.08));
    pool.current.material.opacity = (0.25 + 0.5 * f) * shop.enter;
    light.current.intensity = (14 + 40 * f) * shop.enter;
  });

  return (
    <group position={[i * GAP, 0, 0]}>
      {/* niche in the back wall, with a faint coloured outline */}
      <mesh geometry={arch} position={[0, -2.32, -1.62]} scale={1.035}><meshBasicMaterial color={color} transparent opacity={0.22} /></mesh>
      <mesh geometry={arch} position={[0, -2.25, -1.6]}><meshStandardMaterial color="#1d1722" roughness={0.85} /></mesh>
      <group ref={g}>
        <mesh material={card}><planeGeometry args={[H * aspect, H]} /></mesh>
        <mesh position={[0, 0, -0.03]}><planeGeometry args={[H * aspect + 0.1, H + 0.1]} /><meshBasicMaterial color={color} transparent opacity={0.12} /></mesh>
      </group>
      <mesh position={[0, -2.1, 0]}><cylinderGeometry args={[1.25, 1.35, 0.3, 64]} /><meshStandardMaterial color="#231d28" metalness={0.5} roughness={0.35} /></mesh>
      <mesh position={[0, -1.95, 0]} rotation-x={Math.PI / 2}><torusGeometry args={[1.25, 0.012, 8, 96]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
      {/* real spot for plinth + floor, fake cone for the visible beam */}
      <primitive object={target} position={[0, -2, 0]} />
      <spotLight ref={light} position={[0, 4.6, 0.6]} target={target} angle={0.42} penumbra={0.9} distance={12} decay={1.4} color={color} />
      <mesh position={[0, 1.15, 0.25]} material={beam}><cylinderGeometry args={[0.1, 1.75, 6.8, 48, 1, true]} /></mesh>
      <mesh ref={pool} position={[0, -2.24, 0.25]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[4, 4]} />
        <meshBasicMaterial map={glow} color={color} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <Sparkles count={36} scale={[2.6, 5.5, 2]} position={[0, 0.6, 0.3]} size={2.2} speed={0.35} color={p.color} opacity={0.9} />
    </group>
  );
}

// Wide screens: camera sits left of the focused piece so it lands right of the info panel.
// Tall screens: camera backs off and looks low so the piece floats above the panel.
function Rig() {
  useFrame(({ camera, pointer, size }, dt) => {
    const k = 1 - Math.exp(-dt * 4);
    const tall = size.width / size.height < 1.1;
    shop.off = tall ? 0 : -1.5;
    camera.position.x += (shop.p * (products.length - 1) * GAP + shop.off + pointer.x * 0.5 - camera.position.x) * k;
    camera.position.y += (0.35 + pointer.y * 0.25 - camera.position.y) * k;
    camera.position.z += ((tall ? 14 : 8.6) - camera.position.z) * k;
    camera.lookAt(camera.position.x, tall ? -1.2 : -0.15, 0);
  });
  return null;
}

export default function Shop() {
  const wrap = useRef();
  const [live, setLive] = useState(false); // only render while the gallery is on screen
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting));
    io.observe(wrap.current);
    return () => io.disconnect();
  }, []);
  const glow = useMemo(glowTexture, []);
  const arch = useMemo(() => new THREE.ShapeGeometry(archShape(3.4, 5.6), 24), []);
  const mid = ((products.length - 1) * GAP) / 2;
  return (
    <div ref={wrap} style={{ position: "absolute", inset: 0 }}>
      <Canvas frameloop={live ? "always" : "never"} camera={{ position: [0, 0.35, 8.6], fov: 40 }} dpr={[1, 1.5]} gl={{ antialias: false }}>
        <color attach="background" args={["#0a0710"]} />
        <fog attach="fog" args={["#0a0710", 9, 24]} />
        <ambientLight intensity={0.25} />
        <Rig />
        <mesh position={[mid, 1, -1.7]}><planeGeometry args={[60, 14]} /><meshStandardMaterial color="#120d17" roughness={0.9} /></mesh>
        <mesh position={[mid, -2.25, 2]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[60, 14]} />
          <MeshReflectorMaterial blur={[300, 80]} resolution={512} mixBlur={1} mixStrength={18} roughness={0.9} depthScale={1.1} minDepthThreshold={0.4} maxDepthThreshold={1.3} color="#0d0a12" metalness={0.6} mirror={0.6} />
        </mesh>
        <Suspense fallback={null}>
          {products.map((p, i) => <Exhibit key={p.id} p={p} i={i} glow={glow} arch={arch} />)}
        </Suspense>
        <Sparkles count={120} scale={[(products.length + 1) * GAP, 6, 6]} position={[mid, 0.5, -0.5]} size={1.6} speed={0.2} opacity={0.5} color="#ffe9c2" />
      </Canvas>
    </div>
  );
}

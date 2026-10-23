"use client";
// Floating island modelled after "Stylized 3D Floating Island and Mine House" (Sketchfab, Skylar Muffin), rebuilt by hand:
// sculpted slate-rock underside, thick overhanging grass, dirt path + stone stairs, tall pines,
// a timber-frame house with blue slate roofs and a water wheel. Everything is procedural; no downloaded assets.
import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { cam } from "@/lib/data";
import { rand, tex } from "@/lib/textures";
import { fallMaterial, poolMaterial, waterMats } from "@/lib/water";
import Futurism from "./Futurism";

const fr = (v) => v - Math.floor(v);
const col = (h) => new THREE.Color(h);

// layout (island space, lawn top at y = 0)
const PLATEAU = { x: 0.15, z: -1.05, r: 2.0, h: 0.5 };
const onPlateau = (x, z, pad = 0) => Math.hypot(x - PLATEAU.x, z - PLATEAU.z) < PLATEAU.r + pad;
const PATH = [[-3.1, 1.55], [-1.9, 1.8], [-0.6, 1.6], [0.6, 1.55], [1.35, 1.3], [1.55, 0.98]];

// ---------- shared materials ----------
let M;
function mats() {
  if (M) return M;
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
  M = {
    rock: std({ vertexColors: true, flatShading: true, roughness: 0.85, envMapIntensity: 0.6 }),
    stone: std({ vertexColors: true, flatShading: true, roughness: 0.7, color: "#d6dae2" }),
    core: std({ color: "#2c3039", flatShading: true, roughness: 1 }),
    lawn: std({ map: tex("grass", [7, 7]), color: "#a9c86a" }),
    turf: std({ color: "#3d6420" }),
    clump: std({ vertexColors: true, roughness: 0.9 }),
    blade: std({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.9 }),
    path: std({ map: tex("dirt", [1, 1]), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 }),
    slate: std({ map: tex("slate", [3, 2]), roughness: 0.6 }),
    plaster: std({ map: tex("plaster", [2, 1]) }),
    planks: std({ map: tex("planks", [2, 1]) }),
    timber: std({ color: "#3a2516", roughness: 0.9 }),
    brick: std({ map: tex("brick", [2, 0.6]), color: "#c3c6cc" }),
    trunk: std({ map: tex("bark", [1, 3]), color: "#e09a5c" }),
    pine: std({ vertexColors: true, flatShading: true, side: THREE.DoubleSide, roughness: 0.9 }),
    window: std({ color: "#1f2b40", emissive: "#ffbe6a", emissiveIntensity: 0.15, roughness: 0.3 }),
    lamp: std({ color: "#fff1c9", emissive: "#ffc46b", emissiveIntensity: 0.6 }),
    metal: std({ color: "#2b303b", metalness: 0.6, roughness: 0.4 }),
    sack: std({ color: "#cdb68c", roughness: 1 }),
    tank: std({ color: "#9cc8e6", roughness: 0.5 }),
  };
  // grass sways in the wind: bend each blade by its height, phase from its position
  M.wind = { value: 0 };
  M.blade.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = M.wind;
    sh.vertexShader = "uniform float uTime;\n" + sh.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
      #ifdef USE_INSTANCING
        float ph = instanceMatrix[3].x * 2.3 + instanceMatrix[3].z * 1.7;
        transformed.x += sin(uTime * 1.8 + ph) * 0.35 * position.y;
        transformed.z += cos(uTime * 1.3 + ph) * 0.22 * position.y;
      #endif`);
  };
  return M;
}

// ---------- geometry ----------
// Position-hashed jitter: vertices shared along seams move together, so nothing tears.
function jitter(g, amt, seed) {
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const h = (a, b, c) => fr(Math.sin(x * a + y * b + z * c + seed) * 43758.5453) - 0.5;
    p.setXYZ(i, x + h(12.9, 78.2, 37.7) * amt, y + h(39.3, 11.1, 73.9) * amt, z + h(93.9, 27.1, 51.7) * amt);
  }
  return g;
}

const G = {};
const ROCK_UP = col("#58606f"), ROCK_MID = col("#343944"), ROCK_LOW = col("#15171d");
// Sculpted chunk: bevelled box, jittered, faceted; lit faces pale blue-grey, undersides near black.
function chunk(v) {
  if (G["k" + v]) return G["k" + v];
  const g = jitter(new RoundedBoxGeometry(1, 1, 1, 2, 0.22), 0.16, v * 5.3 + 1).toNonIndexed();
  g.computeVertexNormals();
  const n = g.attributes.normal, colors = new Float32Array(n.count * 3), c = new THREE.Color();
  for (let i = 0; i < n.count; i += 3) {
    const ny = (n.getY(i) + n.getY(i + 1) + n.getY(i + 2)) / 3;
    if (ny > 0) c.copy(ROCK_MID).lerp(ROCK_UP, Math.pow(ny, 1.4));
    else c.copy(ROCK_MID).lerp(ROCK_LOW, Math.min(1, -ny * 1.2));
    c.multiplyScalar(0.9 + fr(Math.sin(i * 7.31 + v) * 999) * 0.2);
    for (let k = 0; k < 3; k++) colors.set([c.r, c.g, c.b], (i + k) * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return (G["k" + v] = g);
}

const LEAF = ["#1b3a16", "#2f5a1d", "#4a7a25", "#6f9a34"].map(col);
function clump(v) {
  if (G["c" + v]) return G["c" + v];
  let g = new THREE.IcosahedronGeometry(1, 2);
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  g = mergeVertices(g);
  const p = g.attributes.position, colors = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const b = 0.14 * Math.sin(x * 9 + v) * Math.sin(y * 9 + v * 2) * Math.sin(z * 9 + v * 3);
    p.setXYZ(i, x * (1 + b), y * (1 + b), z * (1 + b));
    const t = THREE.MathUtils.clamp(0.4 + 0.5 * y + b * 3, 0, 0.999) * 3, s = Math.floor(t);
    c.copy(LEAF[s]).lerp(LEAF[s + 1], t - s);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return (G["c" + v] = g);
}

// Grass blade: thin 3-sided spike, dark at the root, full colour at the tip (tinted per instance).
function blade() {
  if (G.blade) return G.blade;
  const g = new THREE.ConeGeometry(0.022, 0.24, 3, 1).translate(0, 0.12, 0);
  const p = g.attributes.position, colors = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const k = 0.3 + 0.7 * THREE.MathUtils.clamp(p.getY(i) / 0.24, 0, 1);
    colors.set([k, k, k], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return (G.blade = g);
}

const PINE = { core: col("#0e2216"), mid: col("#1d4224"), rim: col("#2f5c2b"), tip: col("#9a6634") };
// One drooping, spiky pine tier (unit size, scaled per tier). Rim spikes hang down and catch warm light at the tips.
function pineTier(v) {
  if (G["p" + v]) return G["p" + v];
  const g = new THREE.ConeGeometry(1, 1, 18, 2, true);
  const p = g.attributes.position, colors = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const a = Math.atan2(z, x), rim = y < -0.49;
    const spike = Math.pow(Math.abs(Math.sin(a * 4.5 + v * 1.7)), 3);
    if (rim) {
      const k = 1 + 0.38 * spike;
      x *= k; z *= k;
      y = -0.5 - 0.3 * spike;
    }
    p.setXYZ(i, x, y, z);
    c.copy(PINE.core).lerp(PINE.mid, Math.min(1, Math.hypot(x, z) * 1.4));
    if (rim) c.copy(PINE.rim).lerp(PINE.tip, spike * 0.55);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return (G["p" + v] = g);
}

// Flat ribbon along a curve on the lawn; u across the path, v along it (world length).
function ribbon(points, width) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, 0, z)));
  const N = 90, len = curve.getLength(), pos = [], uv = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, p = curve.getPointAt(t), tg = curve.getTangentAt(t);
    const n = new THREE.Vector3(-tg.z, 0, tg.x).normalize(), w = (width * (0.85 + 0.3 * Math.sin(t * 9))) / 2;
    pos.push(p.x + n.x * w, 0, p.z + n.z * w, p.x - n.x * w, 0, p.z - n.z * w);
    uv.push(0, t * len * 1.2, 1, t * len * 1.2);
    if (i < N) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return { geo: g, samples: curve.getSpacedPoints(60) };
}

// ---------- instancing helper ----------
const UP = new THREE.Vector3(0, 1, 0);
function Instances({ geo, mat, items, castShadow = false }) {
  const ref = useRef();
  useLayoutEffect(() => {
    const o = new THREE.Object3D(), c = new THREE.Color();
    items.forEach((it, i) => {
      o.position.set(...it.p);
      if (it.q) o.quaternion.copy(it.q);
      else o.rotation.set(it.r?.[0] || 0, it.r?.[1] || 0, it.r?.[2] || 0);
      o.scale.set(...it.s);
      o.updateMatrix();
      ref.current.setMatrixAt(i, o.matrix);
      if (it.c) ref.current.setColorAt(i, c.set(it.c));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [items]);
  return <instancedMesh ref={ref} args={[geo, mat, items.length]} castShadow={castShadow} receiveShadow />;
}

// ---------- island parts ----------
const RINGS = [[-0.55, 3.1, 0.95], [-1.1, 2.95, 1.0], [-1.68, 2.62, 0.98], [-2.25, 2.18, 0.92], [-2.76, 1.66, 0.85], [-3.2, 1.08, 0.76], [-3.55, 0.42, 0.7]];

function RockBody() {
  const m = mats();
  const groups = useMemo(() => {
    const r = rand(71), out = [[], [], []];
    let n = 0;
    for (const [y, rad, size] of RINGS) {
      const count = Math.max(3, Math.round((2 * Math.PI * rad) / (size * 0.78)));
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + r() * 0.35, k = size * (0.7 + r() * 0.75);
        out[n++ % 3].push({
          p: [Math.cos(a) * (rad + (r() - 0.5) * 0.3), y + (r() - 0.5) * 0.4, Math.sin(a) * (rad + (r() - 0.5) * 0.3)],
          r: [(r() - 0.5) * 1.1, -a + (r() - 0.5) * 1.2, (r() - 0.5) * 1.1],
          s: [k * (1 + r() * 0.35), k * (0.75 + r() * 0.35), k * (0.85 + r() * 0.3)],
        });
      }
    }
    return out;
  }, []);
  const core = useMemo(() => jitter(new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), 0.08, 3), []);
  return (
    <>
      <mesh geometry={core} material={m.core} position={[0, -0.15, 0]} scale={[3.25, 3.5, 3.25]} />
      {groups.map((items, v) => <Instances key={v} geo={chunk(v)} mat={m.rock} items={items} castShadow />)}
    </>
  );
}

function Lawn({ path }) {
  const m = mats();
  const { blades, fringe, clumps } = useMemo(() => {
    const r = rand(83);
    const tips = ["#5f8c29", "#76a233", "#4f7a22", "#88ad40", "#a3b952", "#43691f"];
    const nearPath = (x, z) => path.some((p) => Math.hypot(p.x - x, p.z - z) < 0.36);
    const blades = [];
    for (let tries = 0; blades.length < 5200 && tries < 40000; tries++) {
      const a = r() * Math.PI * 2, rad = Math.sqrt(r()) * 3.48, x = Math.cos(a) * rad, z = Math.sin(a) * rad;
      if (nearPath(x, z)) continue;
      const up = onPlateau(x, z);
      if (up && Math.abs(x - 0.2) < 1.5 && z > -1.85 && z < -0.35) continue; // house footprint
      if (!up && onPlateau(x, z, 0.12)) continue; // retaining wall
      if (Math.abs(x - 1.55) < 0.32 && z > 0.3 && z < 1.0) continue; // stairs
      const k = 0.65 + r() * 0.9;
      blades.push({ p: [x, up ? PLATEAU.h : 0, z], r: [(r() - 0.5) * 0.4, r() * 6, (r() - 0.5) * 0.4], s: [1, k, 1], c: tips[Math.floor(r() * tips.length)] });
    }
    // grass spilling over the rim, pointing out and down
    const fringe = [];
    for (let i = 0; i < 900; i++) {
      const a = r() * Math.PI * 2, rad = 3.42 + r() * 0.16, out = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
      const tilt = 1.55 + r() * 0.9, dir = out.clone().multiplyScalar(Math.sin(tilt)).addScaledVector(UP, Math.cos(tilt));
      const k = 1.0 + r() * 1.3;
      fringe.push({ p: [out.x * rad, -0.02 - r() * 0.12, out.z * rad], q: new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize()), s: [1.2, k, 1.2], c: tips[Math.floor(r() * tips.length)] });
    }
    // soft turf lumps along the edge
    const clumps = [[], [], []];
    for (let i = 0; i < 54; i++) {
      const a = (i / 54) * Math.PI * 2 + r() * 0.05, rad = 3.45 + r() * 0.05, k = 0.2 + r() * 0.16;
      clumps[i % 3].push({ p: [Math.cos(a) * rad, -0.06, Math.sin(a) * rad], r: [0, r() * 6, 0], s: [k * 1.3, k * 0.75, k * 1.3] });
    }
    return { blades, fringe, clumps };
  }, [path]);
  return (
    <>
      <mesh position={[0, -0.17, 0]} material={[m.turf, m.lawn, m.core]}><cylinderGeometry args={[3.52, 3.42, 0.34, 72]} /></mesh>
      {clumps.map((items, v) => <Instances key={v} geo={clump(v)} mat={m.clump} items={items} />)}
      <Instances geo={blade()} mat={m.blade} items={blades} />
      <Instances geo={blade()} mat={m.blade} items={fringe} />
    </>
  );
}

function Plateau() {
  const m = mats();
  const wall = useMemo(() => {
    const r = rand(97), out = [[], [], []];
    for (let i = 0; i < 46; i++) {
      const a = (i / 46) * Math.PI * 2, x = PLATEAU.x + Math.cos(a) * PLATEAU.r, z = PLATEAU.z + Math.sin(a) * PLATEAU.r;
      if (Math.abs(x - 1.55) < 0.3 && z > 0) continue; // stairs gap
      const k = 0.32 + r() * 0.14;
      out[i % 3].push({ p: [x, 0.2 + r() * 0.08, z], r: [r() * 0.4, -a, r() * 0.4], s: [k * 1.25, k * 1.25, k] });
    }
    return out;
  }, []);
  return (
    <>
      <mesh position={[PLATEAU.x, PLATEAU.h / 2 - 0.02, PLATEAU.z]} material={m.core}><cylinderGeometry args={[PLATEAU.r - 0.05, PLATEAU.r, PLATEAU.h, 48]} /></mesh>
      <mesh position={[PLATEAU.x, PLATEAU.h - 0.03, PLATEAU.z]} material={m.lawn}><cylinderGeometry args={[PLATEAU.r + 0.04, PLATEAU.r + 0.04, 0.08, 48]} /></mesh>
      {wall.map((items, v) => <Instances key={v} geo={chunk(v)} mat={m.stone} items={items} castShadow />)}
      {/* stone stairs from the path up to the house */}
      {[0, 1, 2, 3, 4].map((i) => {
        const top = 0.1 * (i + 1);
        return <mesh key={i} geometry={chunk(i % 3)} material={m.stone} position={[1.55, top / 2, 0.9 - i * 0.13]} scale={[0.52, top, 0.2]} rotation-y={(i % 2) * 0.06} />;
      })}
      {/* rock outcrop behind, right */}
      {[[2.45, 0.35, -1.95, 0.75], [2.75, 0.85, -1.55, 0.5], [2.15, 0.95, -2.2, 0.42], [2.9, 0.28, -0.95, 0.5]].map(([x, y, z, k], i) => (
        <mesh key={i} geometry={chunk(i % 3)} material={m.stone} position={[x, y, z]} scale={[k * 1.1, k * 1.25, k]} rotation={[0.2 * i, i, 0.1]} />
      ))}
    </>
  );
}

function Pine({ position, height = 2.6, seed = 1 }) {
  const g = useRef();
  const m = mats();
  const tiers = useMemo(() => {
    const W = height * 0.3;
    return Array.from({ length: 9 }, (_, k) => {
      const f = k / 8;
      return { y: height * (0.2 + 0.74 * f), r: W * (1 - 0.82 * f) * (0.9 + fr(Math.sin(k + seed) * 99) * 0.2), h: W * 0.55, v: (k + seed) % 5 };
    });
  }, [height, seed]);
  useFrame(({ clock }) => (g.current.rotation.z = Math.sin(clock.elapsedTime * 0.7 + seed) * 0.02));
  return (
    <group ref={g} position={position}>
      <mesh position={[0, height * 0.47, 0]} material={m.trunk}><cylinderGeometry args={[0.02, 0.075, height * 0.95, 8]} /></mesh>
      {tiers.map((t, k) => <mesh key={k} geometry={pineTier(t.v)} material={m.pine} position={[0, t.y, 0]} scale={[t.r, t.h, t.r]} rotation-y={k * 1.1 + seed} />)}
      <mesh position={[0, height * 0.99, 0]} material={m.pine} geometry={pineTier(seed % 5)} scale={[0.06, 0.22, 0.06]} />
    </group>
  );
}

// Gable roof with its ridge along x: two slate slabs plus gable-end walls.
function Roof({ w, d, h, y, position = [0, 0, 0], wall = "plaster", over = 0.09, ...props }) {
  const m = mats();
  const slope = Math.atan2(h, d / 2), len = Math.hypot(h, d / 2) + over;
  const end = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-d / 2, 0); s.lineTo(d / 2, 0); s.lineTo(0, h); s.closePath();
    return new THREE.ShapeGeometry(s);
  }, [d, h]);
  return (
    <group position={[position[0], y, position[2]]} {...props}>
      {[1, -1].map((s) => (
        <mesh key={s} material={m.slate} position={[0, h / 2 + 0.03, (s * d) / 4]} rotation-x={s * slope}><boxGeometry args={[w + over * 2, 0.06, len]} /></mesh>
      ))}
      {[1, -1].map((s) => (
        <mesh key={s} geometry={end} material={m[wall]} position={[(s * w) / 2 - s * 0.01, 0, 0]} rotation-y={(s * Math.PI) / 2} />
      ))}
    </group>
  );
}

const Box = ({ args, mat, ...p }) => <mesh material={mats()[mat]} {...p}><boxGeometry args={args} /></mesh>;

// Timber frame on one wall face (wall centred at origin in the xy plane, facing +z).
function Frame({ w, h, braces = true }) {
  const t = 0.05;
  return (
    <>
      {[-w / 2, w / 2, -w / 6, w / 6].map((x, i) => <Box key={i} args={[t, h, t]} mat="timber" position={[x, 0, 0.01]} />)}
      {[-h / 2 + t / 2, h / 2 - t / 2].map((y, i) => <Box key={i} args={[w + t, t, t]} mat="timber" position={[0, y, 0.01]} />)}
      {braces && [-1, 1].map((s) => <Box key={s} args={[t * 0.8, Math.hypot(w / 3, h) * 0.95, t * 0.8]} mat="timber" position={[(s * w) / 3, 0, 0.012]} rotation-z={s * Math.atan2(w / 3, h)} />)}
    </>
  );
}

function Win({ position, size = [0.2, 0.26] }) {
  return (
    <group position={position}>
      <Box args={[size[0] + 0.06, size[1] + 0.06, 0.03]} mat="timber" />
      <Box args={[size[0], size[1], 0.04]} mat="window" />
    </group>
  );
}

function Rotor({ len, speed, position }) {
  const r = useRef();
  useFrame((_, dt) => (r.current.rotation.y += dt * speed));
  return (
    <group position={position}>
      <group ref={r}>
        {[0, Math.PI / 2].map((a) => <Box key={a} args={[len, 0.015, 0.06]} mat="metal" rotation-y={a} />)}
      </group>
      <mesh material={mats().metal}><sphereGeometry args={[0.04, 12, 12]} /></mesh>
    </group>
  );
}

function WaterWheel(props) {
  const g = useRef();
  useFrame((_, dt) => (g.current.rotation.z -= dt * 0.6));
  const m = mats();
  return (
    <group {...props}>
      <group ref={g}>
        {[-0.08, 0.08].map((z) => <mesh key={z} position-z={z} material={m.timber}><torusGeometry args={[0.42, 0.028, 8, 32]} /></mesh>)}
        {[0, 1, 2, 3].map((i) => <Box key={i} args={[0.84, 0.035, 0.035]} mat="timber" rotation-z={(i * Math.PI) / 4} />)}
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <Box key={i} args={[0.05, 0.16, 0.22]} mat="planks" position={[Math.cos(a) * 0.45, Math.sin(a) * 0.45, 0]} rotation-z={a} />;
        })}
      </group>
      <mesh rotation-x={Math.PI / 2} material={m.metal}><cylinderGeometry args={[0.04, 0.04, 0.3, 10]} /></mesh>
    </group>
  );
}

function Smoke({ position, tex: smokeTex }) {
  const refs = useRef([]);
  useFrame(({ clock }) =>
    refs.current.forEach((s, i) => {
      const a = (clock.elapsedTime * 0.22 + i / 6) % 1;
      s.position.set(Math.sin(a * 4 + i) * 0.1 + a * 0.25, a * 1.4, 0);
      s.scale.setScalar(0.12 + a * 0.6);
      s.material.opacity = (1 - a) * 0.6;
    })
  );
  return (
    <group position={position}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <sprite key={i} ref={(o) => (refs.current[i] = o)}>
          <spriteMaterial map={smokeTex} transparent depthWrite={false} toneMapped={false} />
        </sprite>
      ))}
    </group>
  );
}

// The museum: a timber-frame mine house with steep blue slate roofs, a tower with a slow rotor, and a water wheel.
function House({ smokeTex }) {
  const flume = useMemo(() => poolMaterial({ flow: [0, 1.4], size: [0.4, 2] }), []);
  return (
    <group position={[0.05, PLATEAU.h, -1.2]} scale={1.15}>
      {/* stone foundation + ground floor (plaster, timber frame) */}
      <Box args={[1.9, 0.2, 1.3]} mat="brick" position={[0, 0.1, 0]} />
      <Box args={[1.7, 0.75, 1.15]} mat="plaster" position={[0, 0.575, 0]} />
      <group position={[0, 0.575, 0.58]}><Frame w={1.7} h={0.75} /></group>
      <group position={[0.86, 0.575, 0]} rotation-y={Math.PI / 2}><Frame w={1.15} h={0.75} braces={false} /></group>
      {/* dark plank upper floor, overhanging */}
      <Box args={[1.82, 0.55, 1.27]} mat="planks" position={[0, 1.225, 0]} />
      <Box args={[1.9, 0.06, 1.35]} mat="timber" position={[0, 0.97, 0]} />
      <Roof w={1.86} d={1.34} h={0.85} y={1.5} wall="planks" />
      {/* front cross gable */}
      <Box args={[0.78, 0.55, 0.5]} mat="plaster" position={[-0.25, 1.22, 0.62]} />
      <group position={[-0.25, 1.22, 0.88]}><Frame w={0.78} h={0.55} /></group>
      <Roof w={0.62} d={0.9} h={0.62} y={1.5} position={[-0.25, 0, 0.62]} rotation-y={Math.PI / 2} />
      {/* right wing */}
      <Box args={[0.9, 0.95, 0.95]} mat="plaster" position={[1.25, 0.675, 0.12]} />
      <group position={[1.25, 0.675, 0.6]}><Frame w={0.9} h={0.95} /></group>
      <Roof w={0.95} d={1.0} h={0.6} y={1.15} position={[1.25, 0, 0.12]} rotation-y={Math.PI / 2} />
      {/* tower with a slow rotor on top: the museum still never lands */}
      <Box args={[0.46, 2.1, 0.46]} mat="planks" position={[-0.78, 1.25, -0.38]} />
      <mesh position={[-0.78, 2.67, -0.38]} rotation-y={Math.PI / 4} material={mats().slate}><coneGeometry args={[0.42, 0.75, 4]} /></mesh>
      <Box args={[0.03, 0.3, 0.03]} mat="metal" position={[-0.78, 3.12, -0.38]} />
      <Rotor len={1.3} speed={0.5} position={[-0.78, 3.27, -0.38]} />
      {/* chimney */}
      <Box args={[0.22, 1.0, 0.22]} mat="brick" position={[0.55, 2.05, -0.3]} />
      <Smoke position={[0.55, 2.6, -0.3]} tex={smokeTex} />
      {/* windows, door, porch */}
      {[-0.55, 0.4].map((x) => <Win key={x} position={[x, 0.62, 0.6]} />)}
      {[-0.55, 0.15, 0.6].map((x) => <Win key={x} position={[x, 1.25, 0.65]} size={[0.18, 0.22]} />)}
      <Win position={[-0.25, 1.25, 0.9]} size={[0.22, 0.24]} />
      {[1.05, 1.45].map((x) => <Win key={x} position={[x, 0.7, 0.61]} size={[0.16, 0.24]} />)}
      <Box args={[0.3, 0.5, 0.04]} mat="planks" position={[0.05, 0.45, 0.6]} />
      <Roof w={0.5} d={0.4} h={0.18} y={0.78} position={[0.05, 0, 0.76]} />
      {/* water wheel at the front-left, fed by a flume, spilling down a chute to the lawn */}
      <WaterWheel position={[-1.12, 0.42, 0.42]} />
      <Box args={[0.22, 0.06, 1.0]} mat="planks" position={[-1.12, 0.95, -0.15]} rotation-x={0.12} />
      <mesh position={[-1.12, 0.99, -0.15]} rotation={[-Math.PI / 2 + 0.12, 0, 0]} material={flume}><planeGeometry args={[0.16, 0.98]} /></mesh>
      <Box args={[0.26, 0.06, 1.05]} mat="planks" position={[-1.28, -0.22, 1.05]} rotation-x={0.45} />
      <mesh position={[-1.28, -0.18, 1.05]} rotation={[-Math.PI / 2 + 0.45, 0, 0]} material={flume}><planeGeometry args={[0.18, 1.0]} /></mesh>
    </group>
  );
}

function Lamp({ position }) {
  const m = mats();
  return (
    <group position={position}>
      <mesh position-y={0.3} material={m.metal}><cylinderGeometry args={[0.015, 0.02, 0.6, 6]} /></mesh>
      <mesh position-y={0.63} material={m.lamp}><boxGeometry args={[0.07, 0.09, 0.07]} /></mesh>
    </group>
  );
}

function Props() {
  const m = mats();
  return (
    <>
      {/* small shed with a blue roof and a water tank */}
      <group position={[-2.35, 0, -0.5]} rotation-y={0.5}>
        <Box args={[0.7, 0.55, 0.6]} mat="planks" position-y={0.275} />
        <Roof w={0.7} d={0.62} h={0.32} y={0.55} wall="planks" />
        <mesh position={[0.5, 0.25, 0.15]} material={m.tank}><cylinderGeometry args={[0.16, 0.16, 0.5, 16]} /></mesh>
      </group>
      {/* crates, sacks, logs */}
      {[[-1.55, 0.11, 0.55, 0.22, 0.2], [-1.32, 0.11, 0.7, 0.2, 0.7], [-1.45, 0.32, 0.6, 0.18, 0.4]].map(([x, y, z, k, ry], i) => (
        <Box key={i} args={[k, k, k]} mat="planks" position={[x, y, z]} rotation-y={ry} />
      ))}
      {[[-1.75, 0.09, 0.85], [-1.9, 0.08, 0.7]].map((p, i) => (
        <mesh key={i} position={p} scale={[0.12, 0.09, 0.1]} material={m.sack}><sphereGeometry args={[1, 10, 8]} /></mesh>
      ))}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-2.75 + (i % 2) * 0.06, 0.07 + Math.floor(i / 2) * 0.12, 0.2 + i * 0.13]} rotation={[0, 0.3, Math.PI / 2]} material={m.trunk}>
          <cylinderGeometry args={[0.065, 0.065, 0.6, 8]} />
        </mesh>
      ))}
      {/* fence along the left edge */}
      {Array.from({ length: 6 }, (_, i) => {
        const a = 2.3 + i * 0.13;
        return <Box key={i} args={[0.05, 0.32, 0.05]} mat="timber" position={[Math.cos(a) * 3.15, 0.16, Math.sin(a) * 3.15]} />;
      })}
      {[0.12, 0.26].map((y) => (
        <mesh key={y} position={[Math.cos(2.62) * 3.12, y, Math.sin(2.62) * 3.12]} rotation-y={-2.62} material={m.timber}>
          <boxGeometry args={[0.03, 0.035, 2.05]} />
        </mesh>
      ))}
      <Lamp position={[-0.4, 0, 2.15]} />
      <Lamp position={[1.0, 0, 1.95]} />
      <Lamp position={[1.85, 0, 0.95]} />
    </>
  );
}

function Drifters() {
  const refs = useRef([]);
  const list = [[4.4, -2.3, 1.2, 0.32], [-4.1, -3.1, -0.4, 0.4], [1.6, -5.0, 2.1, 0.22], [-2.1, -4.6, 2.4, 0.26], [3.2, -4.2, -1.8, 0.18]];
  useFrame(({ clock }) => refs.current.forEach((o, i) => {
    o.position.y = list[i][1] + Math.sin(clock.elapsedTime * 0.6 + i * 1.7) * 0.15;
    o.rotation.y = clock.elapsedTime * 0.1 * (i % 2 ? 1 : -1);
  }));
  return list.map(([x, y, z, k], i) => (
    <mesh key={i} ref={(o) => (refs.current[i] = o)} geometry={chunk(i % 3)} material={mats().rock} position={[x, y, z]} scale={[k * 1.2, k, k * 1.1]} />
  ));
}

function Birds() {
  const refs = useRef([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    refs.current.forEach((b, i) => {
      const a = t * 0.22 + i * 0.45, rad = 5.4 + i * 0.35;
      b.position.set(Math.cos(a) * rad, 2.9 + Math.sin(t * 0.7 + i) * 0.35 + i * 0.15, Math.sin(a) * rad);
      b.rotation.y = -a;
      const f = Math.sin(t * 9 + i * 2) * 0.6;
      b.children[0].rotation.x = f;
      b.children[1].rotation.x = -f;
    });
  });
  return [0, 1, 2, 3].map((i) => (
    <group key={i} ref={(o) => (refs.current[i] = o)}>
      {[1, -1].map((d) => <group key={d}><Box args={[0.07, 0.008, 0.2]} mat="metal" position={[0, 0, d * 0.1]} /></group>)}
    </group>
  ));
}

const PINES = [[-2.7, -1.6, 2.7, 1], [-1.75, -2.45, 3.0, 2], [-0.85, -2.75, 2.5, 3], [0.95, -2.75, 3.5, 4], [1.75, -2.25, 2.8, 5], [2.55, -1.2, 2.3, 6], [-3.05, 0.55, 2.3, 7], [3.0, 0.55, 1.2, 8], [2.75, 1.55, 0.8, 9]];

export default function Island({ tex: cloudTex }) {
  const g = useRef();
  const { size } = useThree();
  const wide = size.width > 800;
  const m = mats();
  const path = useMemo(() => ribbon(PATH, 0.5), []);
  const fall = useMemo(() => fallMaterial(1, 0.015), []);

  useLayoutEffect(() => {
    g.current.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh || o.material.transparent || o.material.isShaderMaterial) return;
      o.castShadow = o.receiveShadow = true;
    });
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    m.wind.value = t;
    m.window.emissiveIntensity = 0.15 + cam.night * 2.6;
    m.lamp.emissiveIntensity = 0.6 + cam.night * 3;
    waterMats.forEach((w) => { w.uniforms.uTime.value = t; w.uniforms.uNight.value = cam.night; });
    g.current.position.set(wide ? cam.ix : 0, (wide ? 0 : -1.2) + Math.sin(t * 0.6) * 0.12, 0);
    g.current.rotation.set(Math.sin(t * 0.4) * 0.02, cam.ry, Math.sin(t * 0.5) * 0.025);
    g.current.scale.setScalar(wide ? 0.85 : 0.62);
  });

  return (
    <group ref={g}>
      <RockBody />
      <Lawn path={path.samples} />
      <mesh geometry={path.geo} material={m.path} position-y={0.006} receiveShadow />
      <Plateau />
      <House smokeTex={cloudTex} />
      <Props />
      {/* pines: tall and slender like the reference, clustered behind and around the house */}
      {PINES.map(([x, z, h, s]) => <Pine key={s} position={[x, onPlateau(x, z, 0.05) ? PLATEAU.h : 0, z]} height={h} seed={s} />)}
      {/* thin waterfall spilling off the left edge */}
      <group position={[-3.48, -0.05, 0.9]} rotation-y={Math.atan2(-0.967, 0.252)}>
        <mesh position={[0, -2.1, 0.05]} material={fall}><planeGeometry args={[0.14, 4.2, 1, 24]} /></mesh>
      </group>
      <Drifters />
      <Birds />
      <Futurism />
    </group>
  );
}

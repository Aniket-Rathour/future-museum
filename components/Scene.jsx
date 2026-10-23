"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, Sparkles } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { cam } from "@/lib/data";
import { rand } from "@/lib/textures";
import Island from "./Island";

function cloudTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const x = c.getContext("2d");
  const r = rand(3);
  for (let i = 0; i < 16; i++) {
    const px = 60 + r() * 136, py = 100 + r() * 70, rad = 30 + r() * 38;
    const gr = x.createRadialGradient(px, py, 0, px, py, rad);
    gr.addColorStop(0, "rgba(255,255,255,.55)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = gr;
    x.fillRect(0, 0, 256, 256);
  }
  x.globalCompositeOperation = "source-atop"; // shade the underside blue-grey
  const sh = x.createLinearGradient(0, 80, 0, 190);
  sh.addColorStop(0, "rgba(255,255,255,1)");
  sh.addColorStop(1, "rgba(172,192,226,1)");
  x.fillStyle = sh;
  x.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const WHITE = new THREE.Color("#ffffff"), DUSK = new THREE.Color("#8a82c8");

function Clouds({ tex }) {
  const refs = useRef([]);
  const items = useMemo(() => {
    const r = rand(11), out = [];
    const add = (n, xr, yr, zr, sr) => {
      for (let i = 0; i < n; i++)
        out.push({ x: (r() - 0.5) * xr, y: yr[0] + r() * (yr[1] - yr[0]), z: zr[0] + r() * (zr[1] - zr[0]), s: sr[0] + r() * (sr[1] - sr[0]), rot: (r() - 0.5) * 0.3, sp: 0.08 + r() * 0.18 });
    };
    add(6, 40, [6.5, 9], [-16, -10], [6, 9]); // header band
    add(12, 40, [-8.5, -6.5], [-8, 2], [8, 12]); // sea of clouds below
    add(6, 40, [-2, 3], [-14, -9], [6, 9]); // distant
    return out;
  }, []);
  useFrame((_, dt) =>
    items.forEach((c, i) => {
      const s = refs.current[i];
      s.position.x += dt * c.sp;
      if (s.position.x > 22) s.position.x = -22;
      s.material.color.lerpColors(WHITE, DUSK, cam.night);
    })
  );
  return items.map((c, i) => (
    <sprite key={i} ref={(o) => (refs.current[i] = o)} position={[c.x, c.y, c.z]} scale={[c.s, c.s * 0.55, 1]}>
      <spriteMaterial map={tex} transparent depthWrite={false} toneMapped={false} opacity={0.8} rotation={c.rot} />
    </sprite>
  ));
}

const DAY = new THREE.Color("#fff1d0"), NIGHT = new THREE.Color("#7d86ff");

function Rig() {
  const { camera, pointer, scene } = useThree();
  const look = useMemo(() => new THREE.Vector3(), []);
  const p = useRef({ x: 0, y: 0 });
  const sun = useRef();
  useFrame((_, dt) => {
    const k = 1 - Math.exp(-dt * 4);
    p.current.x += (pointer.x - p.current.x) * k;
    p.current.y += (pointer.y - p.current.y) * k;
    camera.position.set(cam.cx + p.current.x * 0.5, cam.cy + p.current.y * 0.3, cam.cz + cam.intro * 9);
    camera.lookAt(look.set(cam.tx, cam.ty, cam.tz));
    scene.environmentIntensity = 0.85 - 0.6 * cam.night;
    sun.current.intensity = 3.2 - 2.2 * cam.night;
    sun.current.color.lerpColors(DAY, NIGHT, cam.night);
  });
  // warm key light from the upper right (where the CSS sun rays come from), casting soft shadows
  return (
    <directionalLight
      ref={sun}
      position={[6, 9, 5]}
      castShadow
      shadow-mapSize={[1024, 1024]}
      shadow-bias={-0.0004}
      shadow-normalBias={0.03}
      shadow-camera-left={-8}
      shadow-camera-right={8}
      shadow-camera-top={8}
      shadow-camera-bottom={-8}
      shadow-camera-far={30}
    />
  );
}

export default function Scene() {
  const tex = useMemo(cloudTexture, []);
  return (
    <div className="scene">
      <Canvas shadows camera={{ position: [0, 1.2, 13], fov: 45 }} dpr={[1, 1.25]} gl={{ alpha: true, antialias: true }} onCreated={({ gl }) => (gl.toneMapping = THREE.NeutralToneMapping)}>
        <ambientLight intensity={0.35} />
        <hemisphereLight args={["#cfe8ff", "#6b5a45", 0.5]} />
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={3} color="#d6ecff" position={[0, 0, -10]} scale={[40, 20, 1]} />
          <Lightformer form="rect" intensity={3} color="#fff0d6" position={[0, 0, 10]} scale={[40, 20, 1]} />
          <Lightformer form="rect" intensity={4} position={[0, 6, -4]} scale={[14, 4, 1]} />
        </Environment>
        <Rig />
        <Island tex={tex} />
        <Clouds tex={tex} />
        <Sparkles count={80} scale={[22, 12, 10]} size={3} speed={0.3} opacity={0.7} color="#fff6d8" />
      </Canvas>
    </div>
  );
}

// Hand-painted style canvas textures for the island, drawn once on the client and cached.
import * as THREE from "three";

export const rand = (seed) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };

const canvases = {};
const textures = {};

function canvas(name, w, h, draw) {
  if (!canvases[name]) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d"), w, h);
    canvases[name] = c;
  }
  return canvases[name];
}

// Soft round blot, also drawn wrapped across edges so tiling has no seams.
function blot(x, px, py, r, color, alpha, size) {
  for (const ox of [-size, 0, size])
    for (const oy of [-size, 0, size]) {
      const cx = px + ox, cy = py + oy;
      if (cx + r < 0 || cx - r > size || cy + r < 0 || cy - r > size) continue;
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, color);
      g.addColorStop(1, "rgba(0,0,0,0)");
      x.globalAlpha = alpha;
      x.fillStyle = g;
      x.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
  x.globalAlpha = 1;
}

const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

const DRAW = {
  // Painterly stone like the diorama: blue-grey body, warm ochre facets, soft crevices, lit edges, moss specks.
  rock(x, s) {
    const r = rand(4);
    x.fillStyle = "#8b93a1";
    x.fillRect(0, 0, s, s);
    for (let i = 0; i < 260; i++) blot(x, r() * s, r() * s, 25 + r() * 70, pick(r, ["#7a8392", "#98a1ae", "#a89a83", "#b49f7e", "#8a8f9b", "#c4b79f"]), 0.22 + r() * 0.2, s);
    // big planar facets, lit from the top-left
    for (let i = 0; i < 90; i++) {
      const px = r() * s, py = r() * s, k = 30 + r() * 80, a = r() * Math.PI;
      const pts = [0, 1, 2, 3, 4].map((j) => [px + Math.cos(a + j * 1.3) * k * (0.6 + r() * 0.4), py + Math.sin(a + j * 1.3) * k * (0.6 + r() * 0.4)]);
      x.fillStyle = pick(r, ["rgba(255,250,240,.10)", "rgba(255,236,200,.12)", "rgba(20,26,40,.10)", "rgba(40,30,20,.08)"]);
      x.beginPath();
      pts.forEach(([u, v], j) => (j ? x.lineTo(u, v) : x.moveTo(u, v)));
      x.closePath();
      x.fill();
      x.strokeStyle = "rgba(255,255,255,.10)";
      x.lineWidth = 2;
      x.beginPath();
      x.moveTo(...pts[0]);
      x.lineTo(...pts[1]);
      x.stroke();
    }
    // a few short soft crevices
    x.lineCap = "round";
    for (let i = 0; i < 14; i++) {
      let px = r() * s, py = r() * s;
      x.strokeStyle = "rgba(38,42,56,.32)";
      x.lineWidth = 2 + r() * 2;
      x.beginPath();
      x.moveTo(px, py);
      for (let j = 0; j < 3; j++) { px += (r() - 0.5) * 40; py += 10 + r() * 25; x.lineTo(px, py); }
      x.stroke();
    }
    for (let i = 0; i < 900; i++) {
      x.fillStyle = r() > 0.5 ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.10)";
      x.fillRect(r() * s, r() * s, 1.5, 1.5);
    }
    for (let i = 0; i < 120; i++) blot(x, r() * s, r() * s * 0.35, 3 + r() * 8, pick(r, ["#6aa83a", "#7fbf45", "#4d8a2a"]), 0.55, s);
  },
  grass(x, s) {
    const r = rand(8);
    x.fillStyle = "#6aa83a";
    x.fillRect(0, 0, s, s);
    for (let i = 0; i < 300; i++) blot(x, r() * s, r() * s, 15 + r() * 50, pick(r, ["#4f8f2c", "#86c24a", "#5d9d33", "#9fd05a"]), 0.25, s);
    x.lineCap = "round";
    for (let i = 0; i < 7000; i++) {
      const px = r() * s, py = r() * s, l = 2 + r() * 5;
      x.strokeStyle = pick(r, ["#4c8a28", "#7dbb45", "#91cc54", "#5b9a31", "#a8d860", "#3f7a22"]);
      x.globalAlpha = 0.75;
      x.lineWidth = 1 + r();
      x.beginPath();
      x.moveTo(px, py);
      x.lineTo(px + (r() - 0.5) * 2, py - l);
      x.stroke();
    }
    x.globalAlpha = 1;
    for (let i = 0; i < 140; i++) {
      x.fillStyle = pick(r, ["#ffffff", "#ffe066", "#ff9ec7", "#c7a6ff", "#fff5d6"]);
      x.beginPath();
      x.arc(r() * s, r() * s, 1.2 + r() * 1.6, 0, 7);
      x.fill();
    }
  },
  soil(x, s) {
    const r = rand(12);
    x.fillStyle = "#8a5a32";
    x.fillRect(0, 0, s, s);
    let y = s * 0.16;
    while (y < s) {
      const h = 6 + r() * 16;
      x.fillStyle = pick(r, ["#7a4a28", "#9b6a3c", "#6a3f22", "#a8784a", "#8f6038"]);
      x.beginPath();
      x.moveTo(0, y);
      for (let px = 0; px <= s; px += 16) x.lineTo(px, y + Math.sin(px * 0.05 + y) * 3);
      x.lineTo(s, y + h);
      x.lineTo(0, y + h);
      x.fill();
      y += h;
    }
    for (let i = 0; i < 90; i++) {
      x.fillStyle = pick(r, ["#b8b2a8", "#9d978e", "#d0c8bb"]);
      x.beginPath();
      x.ellipse(r() * s, s * 0.2 + r() * s * 0.8, 2 + r() * 5, 1.5 + r() * 3, r() * 3, 0, 7);
      x.fill();
    }
    // grass lip hanging over the soil
    x.fillStyle = "#6aa83a";
    x.beginPath();
    x.moveTo(0, 0);
    x.lineTo(s, 0);
    for (let px = s; px >= 0; px -= 6) x.lineTo(px, s * 0.13 + (r() * s * 0.07));
    x.fill();
  },
  brick(x, s) {
    const r = rand(15);
    x.fillStyle = "#4b525e";
    x.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 26) {
      let px = -r() * 30;
      while (px < s) {
        const w = 26 + r() * 26;
        x.fillStyle = pick(r, ["#7d8696", "#8e98a8", "#6c7584", "#9aa3b1", "#838a97"]);
        x.beginPath();
        x.roundRect(px + 2, y + 2, w - 4, 22, 6);
        x.fill();
        x.fillStyle = "rgba(255,255,255,.18)";
        x.fillRect(px + 5, y + 3, w - 10, 3);
        x.fillStyle = "rgba(0,0,0,.18)";
        x.fillRect(px + 4, y + 19, w - 8, 3);
        px += w;
      }
    }
  },
  shingle(x, s) {
    const r = rand(18);
    x.fillStyle = "#b86a2c";
    x.fillRect(0, 0, s, s);
    const w = 28, h = 22;
    for (let row = -1; row < s / h + 1; row++) {
      const y = row * h;
      for (let px = row % 2 ? -w / 2 : 0; px < s; px += w) {
        x.fillStyle = pick(r, ["#e29a52", "#d8893f", "#eaa862", "#c97a35", "#f0b46e"]);
        x.strokeStyle = "rgba(95,42,12,.65)";
        x.lineWidth = 2;
        x.beginPath();
        x.moveTo(px, y);
        x.lineTo(px, y + h * 0.55);
        x.arc(px + w / 2, y + h * 0.55, w / 2, Math.PI, 0, true);
        x.lineTo(px + w, y);
        x.fill();
        x.stroke();
        x.fillStyle = "rgba(255,240,200,.25)";
        x.fillRect(px + 4, y + 3, w - 8, 2);
      }
    }
  },
  ashlar(x, s) {
    const r = rand(22);
    x.fillStyle = "#f6f1e8";
    x.fillRect(0, 0, s, s);
    for (let i = 0; i < 120; i++) blot(x, r() * s, r() * s, 20 + r() * 50, pick(r, ["#ece3d4", "#fbf8f2", "#efe6d7"]), 0.3, s);
    x.strokeStyle = "rgba(150,138,120,.2)";
    x.lineWidth = 1.5;
    for (let y = 0, row = 0; y <= s; y += 32, row++) {
      x.beginPath(); x.moveTo(0, y); x.lineTo(s, y); x.stroke();
      for (let px = row % 2 ? 32 : 0; px < s; px += 64) { x.beginPath(); x.moveTo(px, y); x.lineTo(px, y + 32); x.stroke(); }
    }
    x.strokeStyle = "rgba(150,140,130,.1)";
    for (let i = 0; i < 6; i++) {
      x.beginPath();
      x.moveTo(r() * s, r() * s);
      x.bezierCurveTo(r() * s, r() * s, r() * s, r() * s, r() * s, r() * s);
      x.stroke();
    }
  },
  bark(x, s) {
    const r = rand(25);
    x.fillStyle = "#6b4a2f";
    x.fillRect(0, 0, s, s);
    for (let i = 0; i < 260; i++) {
      x.strokeStyle = pick(r, ["#4e341f", "#85603d", "#5c3f27", "#9a7550"]);
      x.lineWidth = 1 + r() * 3;
      const px = r() * s;
      x.beginPath();
      x.moveTo(px, r() * s);
      x.lineTo(px + (r() - 0.5) * 6, r() * s);
      x.stroke();
    }
  },
  // Blue slate roof tiles: offset rows, lit top edge, shadowed lower edge. 20 rows so it tiles vertically.
  slate(x, s) {
    const r = rand(31), h = s / 20;
    x.fillStyle = "#1d2a40";
    x.fillRect(0, 0, s, s);
    for (let row = 0; row < 20; row++) {
      const y = row * h;
      for (let px = row % 2 ? -18 : 0; px < s; ) {
        const w = 30 + r() * 16;
        x.fillStyle = pick(r, ["#3e5f99", "#4a6fae", "#35548a", "#5677b8", "#2f4a7a", "#42649f"]);
        x.beginPath();
        x.roundRect(px + 1.5, y + 1.5, w - 3, h - 2, 3);
        x.fill();
        x.fillStyle = "rgba(255,255,255,.16)";
        x.fillRect(px + 3, y + 2, w - 6, 2);
        x.fillStyle = "rgba(0,0,0,.22)";
        x.fillRect(px + 2, y + h - 5, w - 4, 3);
        px += w;
      }
    }
    for (let i = 0; i < 120; i++) blot(x, r() * s, r() * s, 10 + r() * 30, pick(r, ["#7f9fd6", "#22324d"]), 0.12, s);
  },
  plaster(x, s) {
    const r = rand(33);
    x.fillStyle = "#e7dcc3";
    x.fillRect(0, 0, s, s);
    for (let i = 0; i < 220; i++) blot(x, r() * s, r() * s, 10 + r() * 50, pick(r, ["#d9cbb0", "#efe6d2", "#cdbd9f", "#e0d2b8"]), 0.3, s);
    for (let i = 0; i < 1500; i++) {
      x.fillStyle = r() > 0.5 ? "rgba(255,255,255,.18)" : "rgba(90,70,40,.12)";
      x.fillRect(r() * s, r() * s, 1.5, 1.5);
    }
    const g = x.createLinearGradient(0, s * 0.7, 0, s);
    g.addColorStop(0, "rgba(120,100,70,0)");
    g.addColorStop(1, "rgba(120,100,70,.2)");
    x.fillStyle = g;
    x.fillRect(0, 0, s, s);
  },
  planks(x, s) {
    const r = rand(35), h = s / 16;
    for (let i = 0; i < 16; i++) {
      const y = i * h;
      x.fillStyle = pick(r, ["#4a3020", "#563826", "#3f281a", "#5e3f2a", "#47301f"]);
      x.fillRect(0, y, s, h);
      x.strokeStyle = "rgba(0,0,0,.22)";
      x.lineWidth = 1;
      for (let j = 0; j < 8; j++) {
        const gy = y + 3 + r() * (h - 6);
        x.beginPath();
        x.moveTo(0, gy);
        for (let px = 0; px <= s; px += 32) x.lineTo(px, gy + Math.sin(px * 0.03 + j) * 1.5);
        x.stroke();
      }
      x.fillStyle = "rgba(0,0,0,.55)";
      x.fillRect(0, y, s, 2);
    }
  },
  // Dirt path strip: u runs across the path, v along it. Ragged edges are periodic in v so the strip tiles.
  dirt(x, s) {
    const r = rand(37);
    x.fillStyle = "#c49556";
    x.fillRect(0, 0, s, s);
    for (let i = 0; i < 260; i++) blot(x, r() * s, r() * s, 8 + r() * 40, pick(r, ["#b07e45", "#d7ab6d", "#9c6c3a", "#caa070"]), 0.3, s);
    for (let i = 0; i < 140; i++) {
      x.fillStyle = pick(r, ["#8e8a82", "#a69c8c", "#7a5a3a", "#d9c7a3"]);
      x.beginPath();
      x.ellipse(r() * s, r() * s, 1.5 + r() * 4, 1 + r() * 2.5, r() * 3, 0, 7);
      x.fill();
    }
    x.globalCompositeOperation = "destination-in";
    const edge = (y, ph) => 0.1 + 0.05 * Math.sin((y / s) * Math.PI * 6 + ph) + 0.035 * Math.sin((y / s) * Math.PI * 22 + ph * 2);
    x.beginPath();
    x.moveTo(s * edge(0, 0), 0);
    for (let y = 0; y <= s; y += 4) x.lineTo(s * edge(y, 0), y);
    for (let y = s; y >= 0; y -= 4) x.lineTo(s * (1 - edge(y, 1.7)), y);
    x.closePath();
    x.fill();
    x.globalCompositeOperation = "source-over";
  },
  sign(x, w, h) {
    x.fillStyle = "#efe7da";
    x.fillRect(0, 0, w, h);
    x.fillStyle = "#5a4a38";
    x.font = `600 ${h * 0.62}px Georgia, serif`;
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText("MVSEVM  ·  OF  ·  TOMORROW", w / 2, h / 2 + 4);
  },
};

// tex("rock", [2, 2]) -> CanvasTexture; each name+repeat gets its own texture sharing one canvas.
export function tex(name, repeat = [1, 1], color = true) {
  const key = `${name}:${repeat}:${color}`;
  if (!textures[key]) {
    const t = new THREE.CanvasTexture(canvas(name, name === "sign" ? 1024 : 512, name === "sign" ? 96 : 512, DRAW[name]));
    if (color) t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repeat);
    t.anisotropy = 8;
    textures[key] = t;
  }
  return textures[key];
}

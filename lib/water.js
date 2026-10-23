// Stylized animated water (waterfalls, pond, stream). All materials share uTime/uNight, ticked from one place.
import * as THREE from "three";

export const waterMats = [];

const NOISE = /* glsl */ `
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 4; i++){ v += a * noise(p); p *= 2.03; a *= .5; } return v; }
`;

const VERT = /* glsl */ `
uniform float uTime, uWobble;
varying vec2 vUv;
void main(){
  vUv = uv;
  vec3 p = position;
  p.z += (sin(uv.y * 18. + uTime * 5.) + sin(uv.x * 24. - uTime * 3.) * .4) * uWobble;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
}`;

// Falling sheet: streaks scroll down, white foam at the base; uFade > 0 fades it into the sky instead.
const FALL = /* glsl */ `
uniform float uTime, uNight, uFade;
varying vec2 vUv;
${NOISE}
void main(){
  vec2 uv = vUv;
  float n = fbm(vec2(uv.x * 5., uv.y * 2.5 + uTime * 1.7));
  float s = fbm(vec2(uv.x * 32., uv.y * 2. + uTime * 3.2));
  float filament = pow(noise(vec2(uv.x * 90., uv.y * 9. + uTime * 12.)), 5.);
  vec3 col = mix(vec3(.025, .24, .27), vec3(.35, .73, .72), n);
  col = mix(col, vec3(1.), smoothstep(.46, .72, s) * .85 + filament * .6);
  col = mix(col, vec3(1.), smoothstep(.22, .0, uv.y) * (.6 + .4 * n) * (1. - uFade));
  float ragged = (n - .5) * .18;
  float a = smoothstep(0., .16, uv.x + ragged) * smoothstep(1., .84, uv.x - ragged);
  a *= .82 + .18 * s;
  a *= mix(1., smoothstep(0., .95, uv.y) * (.7 + .3 * n), uFade);
  col = col * mix(1., .5, uNight) + vec3(.05, .25, .4) * uNight;
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}`;

// Flat water: scrolling fbm with cartoon contour ripples and sparkles; uRound adds a shore foam ring.
const POOL = /* glsl */ `
uniform float uTime, uNight, uRound;
uniform vec2 uFlow, uSize;
varying vec2 vUv;
${NOISE}
void main(){
  vec2 p = vUv * uSize + uFlow * uTime;
  float n = fbm(p * 1.4 + uTime * .05);
  float waves = sin(p.x * 22. + n * 8. + uTime * 1.8) * sin(p.y * 28. + n * 9. - uTime * 2.2);
  float glint = pow(max(0., waves), 16.);
  float caustic = pow(1. - abs(sin(p.x * 16. + n * 8.) * sin(p.y * 18. - n * 6.)), 16.);
  vec3 col = mix(vec3(.018, .19, .19), vec3(.12, .53, .49), n);
  col += vec3(.24, .52, .42) * caustic * .25;
  col += vec3(.8, .94, .9) * glint * .85;
  col += pow(noise(p * 18. + uTime * 1.5), 24.) * 1.4;
  float d = length(vUv - .5) * 2.;
  col = mix(col, vec3(1.), smoothstep(.84, .99, d) * (.45 + .55 * n) * uRound);
  float e = max(smoothstep(.22, .0, vUv.x), smoothstep(.78, 1., vUv.x));
  col = mix(col, vec3(1.), e * (.4 + .6 * n) * (1. - uRound) * .8);
  col = col * mix(1., .5, uNight) + vec3(.05, .22, .38) * uNight;
  gl_FragColor = vec4(col, 1.);
  #include <colorspace_fragment>
}`;

function make(frag, uniforms, opts) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uNight: { value: 0 }, uWobble: { value: 0 }, ...uniforms },
    vertexShader: VERT,
    fragmentShader: frag,
    ...opts,
  });
  waterMats.push(m);
  return m;
}

export const fallMaterial = (fade = 0, wobble = 0.01) =>
  make(FALL, { uFade: { value: fade }, uWobble: { value: wobble } }, { transparent: true, depthWrite: false, side: THREE.DoubleSide });

export const poolMaterial = ({ round = 0, flow = [0, 0], size = [2, 2] } = {}) =>
  make(POOL, { uRound: { value: round }, uFlow: { value: new THREE.Vector2(...flow) }, uSize: { value: new THREE.Vector2(...size) } });

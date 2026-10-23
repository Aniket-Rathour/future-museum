// Camera/scene state tweened by GSAP ScrollTrigger (Museum.jsx) and read every frame by Scene.jsx.
export const cam = { cx: 0, cy: 6.0, cz: 14.4, tx: 0, ty: 0, tz: 0, ix: 3.4, ry: -0.32, night: 0, intro: 1 };

export const chapters = [
  { side: "left", tag: "01 · Float", lines: ["A city", "above the <em>clouds.</em>"],
    text: "Cut loose from the ground in 2041, the Museum drifts on a single shard of the old world, carrying everything we haven't built yet." },
  { side: "right", tag: "02 · Gallery", lines: ["Six columns.", "Ten thousand <em>futures.</em>"],
    text: "Step through the hall and meet inventions from 2041 to 2150: neural lace, orbital gardens, engines that fold time." },
  { side: "left", tag: "03 · Rotors", lines: ["It never", "<em>lands.</em>"],
    text: "Slow rotors hold the whole building aloft. One turn a minute, patient enough to keep a memory in the air." },
  { side: "right", tag: "04 · After dark", lines: ["Open", "after <em>dark.</em>"],
    text: "When the sky goes violet the galleries light up. Night visitors get the artifacts too fragile for daylight." },
];

export const shop = { p: 0, enter: 0, off: 0 }; // shelf progress (0..1) and entrance (0..1), tweened by ScrollTrigger

export const products = [
  { id: "01", img: "/products/1.webp", name: "The Veiled Saint", kind: "Bronze sculpture", era: "Recovered 2090", price: "$18,400", color: "#a8e08f",
    blurb: "Found in a forest that grew over the old city. Every spring someone still crowns her with flowers." },
  { id: "02", img: "/products/2.webp", name: "Hands of Light", kind: "Diamond necklace", era: "Atelier 2071", price: "$12,000", color: "#dfe9ff",
    blurb: "Two hundred diamonds that hold starlight, offered by hands carved never to let go." },
  { id: "03", img: "/products/3.webp", name: "Dragon of Ten Thousand Flowers", kind: "Famille-rose porcelain", era: "Qing, Guangxu reign", price: "$64,000", color: "#ffad85",
    blurb: "A blue dragon coils around a vase painted with a thousand blooms, so no flower ever wilts." },
  { id: "04", img: "/products/4.webp", name: "The Book of Spells", kind: "Leather & gold leaf", era: "Bound 1880", price: "$7,700", color: "#e8b562",
    blurb: "Every spell inside is a recipe for a future that hasn't happened yet. Some of them worked." },
  { id: "05", img: "/products/5.webp", name: "Muse of Beauty", kind: "Carrara marble", era: "Carved 2150", price: "$96,000", color: "#ffe2bd",
    blurb: "Carved by a machine that studied the old masters for a century and fell in love with them." },
];

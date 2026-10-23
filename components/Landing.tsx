"use client";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { ChromaticImage } from "@/components/ui/chromatic-image";
import { DitherShader } from "@/components/ui/dither-shader";
import { AsciiArt } from "@/components/ui/ascii-art";

const ease = [0.2, 0.8, 0.2, 1] as const;

// Shared section header: small caps eyebrow, serif title with an italic gradient accent, optional intro.
function Head({ eyebrow, title, accent, intro, center = false }: { eyebrow: string; title: string; accent?: string; intro?: string; center?: boolean }) {
  return (
    <div className={cn("mb-14 max-w-2xl", center && "mx-auto text-center")}>
      <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
        className="mb-5 text-[11px] uppercase tracking-[0.3em] text-white/55">
        {eyebrow}
      </motion.p>
      <h2 aria-label={[title, accent].filter(Boolean).join(" ")} className="font-serif text-4xl leading-[1.05] tracking-tight text-white md:text-6xl">
        {[...title.split(" "), ...(accent ? accent.split(" ").map((w) => "§" + w) : [])].map((w, i) => (
          <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.12em] align-top">
            <motion.span initial={{ y: "110%" }} whileInView={{ y: 0 }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: 0.9, delay: i * 0.07, ease }}
              className={cn("inline-block pr-[0.25em]", w.startsWith("§") && "lux-accent italic")}>
              {w.replace("§", "")}
            </motion.span>
          </span>
        ))}
      </h2>
      {intro && (
        <motion.p initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-6 text-base leading-relaxed text-white/60 md:text-lg">
          {intro}
        </motion.p>
      )}
    </div>
  );
}

const shell = "relative mx-auto w-full max-w-6xl px-6 py-28 md:py-36";

/* ---------------- Three ways to see: chromatic / dither / ascii ---------------- */
// Same near-black as the shop above and the footer below, so the three sections read as one continuous room.
const ROOM = "#0a0710";

export function Lenses() {
  const frame = "relative aspect-[4/5] w-full overflow-hidden rounded-3xl ring-1 ring-white/[0.06] shadow-[0_40px_80px_-30px_rgba(0,0,0,.8)]";
  const items = [
    { label: "Through glass", note: "Move across the Muse: light splits like it does through the dome.", node: <ChromaticImage src="/products/5.webp" alt="Muse of Beauty" className="h-full w-full" backgroundColor={ROOM} /> },
    { label: "Through the archive", note: "How the 2090 recovery drones first saw the Veiled Saint.", node: <DitherShader src="/products/1.webp" gridSize={3} ditherMode="bayer" colorMode="duotone" primaryColor={ROOM} secondaryColor="#e8c48a" backgroundColor={ROOM} className="h-full w-full" objectFit="cover" /> },
    { label: "Through the machine", note: "The Dragon Vase, as the museum's catalogue AI reads it.", node: <AsciiArt src="/products/3.webp" resolution={90} colored animated animationStyle="matrix" animateOnView backgroundColor={ROOM} className="h-full w-full" objectFit="cover" /> },
  ];
  return (
    <section className="relative isolate overflow-hidden" style={{ background: ROOM }}>
      {/* faint warm light from above, no hard edges */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_45%_at_50%_35%,rgba(232,196,138,0.07),transparent_70%)]" />
      {/* pick up from the shop canvas, which renders a shade darker than its background colour */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-56 bg-gradient-to-b from-[#030206] to-transparent" />
      {/* melt into the footer's navy */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-72 bg-gradient-to-b from-transparent to-[#0c102a]" />
      <div className={shell}>
        <Head eyebrow="Three ways to see" title="Every piece," accent="three ways." intro="The same artifacts through three instruments from the museum's conservation lab. Hover, linger, look again." />
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((it, i) => (
            <motion.figure key={it.label} initial={{ opacity: 0, y: 60, filter: "blur(10px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-10%" }} transition={{ duration: 1.1, delay: i * 0.15, ease }}>
              <div className={frame}>{it.node}</div>
              <figcaption className="mt-5">
                <p className="font-serif text-xl text-white">{it.label}</p>
                <p className="mt-1 text-sm text-white/50">{it.note}</p>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

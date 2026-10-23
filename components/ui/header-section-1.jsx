"use client";
import { motion } from "framer-motion";
import { Tagline } from "@/components/ui/header-section-1-utils/tagline";

const ease = [0.2, 0.8, 0.2, 1];

// Ported from the shadcn HeaderSection1 (TSX + Tailwind) to this project's JS + CSS, with scroll-in animation.
// Title words rise out of a mask one by one; `accent` is the italic gradient word(s) at the end.
export function HeaderSection1({ tagline = "Header section", title = "Header section title", accent, description, children }) {
  const words = [...title.split(" ").map((w) => [w, false]), ...(accent ? accent.split(" ").map((w) => [w, true]) : [])];
  return (
    <section className="bg-background section-padding-y" aria-labelledby="page-heading">
      <div className="container-padding-x hs1-container">
        <div className="section-title-gap-xl hs1-inner">
          <div className="section-title-gap-xl hs1-col">
            <Tagline>{tagline}</Tagline>
            <h1 id="page-heading" className="heading-xl text-foreground">
              {words.map(([w, acc], i) => (
                <span className="hs1-mask" key={i}>
                  <motion.span
                    className={acc ? "hs1-word accent" : "hs1-word"}
                    initial={{ yPercent: 110, rotate: 6 }}
                    whileInView={{ yPercent: 0, rotate: 0 }}
                    viewport={{ once: true, margin: "-10%" }}
                    transition={{ duration: 1, delay: 0.15 + i * 0.08, ease }}
                  >
                    {w}
                  </motion.span>
                </span>
              ))}
            </h1>
            {description && (
              <motion.p
                className="text-muted-foreground text-lg-8 text-pretty"
                initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.5, ease }}
              >
                {description}
              </motion.p>
            )}
            {children && (
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.7, ease }}>
                {children}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeaderSection1;

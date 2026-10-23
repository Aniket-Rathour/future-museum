"use client";
import { useRef } from "react";
import { motion, useReducedMotion, useSpring, useTransform } from "framer-motion";

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.85, ease: [0.2, 0.8, 0.2, 1] },
};

function Arrow({ up = false }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={up ? "M12 19V5m-6 6 6-6 6 6" : "M5 12h14m-6-6 6 6-6 6"} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export default function Footer({ onTop }) {
  const root = useRef(null);
  const reducedMotion = useReducedMotion();
  const rotateX = useSpring(0, { stiffness: 55, damping: 22 });
  const rotateY = useSpring(0, { stiffness: 55, damping: 22 });
  const driftX = useTransform(rotateY, [-4, 4], [-20, 20]);
  const driftY = useTransform(rotateX, [-3, 3], [15, -15]);
  const move = (event) => {
    if (reducedMotion || event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    rotateX.set(-((event.clientY - bounds.top) / bounds.height - 0.5) * 6);
    rotateY.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 8);
  };
  const reset = () => { rotateX.set(0); rotateY.set(0); };
  return (
    <motion.footer ref={root} className="site-footer" id="visit" aria-label="Museum of Tomorrow"
      onPointerMove={move} onPointerLeave={reset}
      onViewportEnter={() => { if (root.current) root.current.dataset.active = "true"; }}
      onViewportLeave={() => { if (root.current) root.current.dataset.active = "false"; reset(); }}
      viewport={{ amount: 0.05 }}>
      <div className="ft-atmosphere" aria-hidden="true"><div className="ft-orbit" /><span className="ft-star ft-star-one">✦</span><span className="ft-star ft-star-two">✧</span><span className="ft-star ft-star-three">·</span></div>
      <motion.div className="ft-cosmos" aria-hidden="true" style={reducedMotion ? undefined : { x: driftX, y: driftY }}>
        <div className="ft-nebula" />
        <div className="ft-orbital-system">
          <div className="ft-space-ring ft-space-ring-one"><i /><b /></div>
          <div className="ft-space-ring ft-space-ring-two"><i /></div>
          <div className="ft-space-ring ft-space-ring-three" />
        </div>
        <div className="ft-planet-float"><div className="ft-planet"><div className="ft-planet-bands" /></div><div className="ft-planet-ring" /></div>
        <div className="ft-crystal-float"><div className="ft-crystal"><i /><i /><i /></div><span /></div>
        {Array.from({ length: 22 }, (_, i) => <i key={i} className="ft-dust" style={{ left: `${8 + ((i * 37) % 85)}%`, top: `${8 + ((i * 23) % 77)}%`, "--delay": `${i * -0.7}s`, "--duration": `${5 + (i % 5)}s` }} />)}
      </motion.div>
      <div className="ft-shell">
        <motion.div className="ft-invitation" {...reveal} style={reducedMotion ? undefined : { rotateX, rotateY, transformPerspective: 1400 }}>
          <p className="ft-eyebrow"><span /> YOUR NEXT CHAPTER STARTS HERE</p>
          <h2 className="ft-title">Leave the ordinary.<br /><em>Keep the wonder.</em></h2>
          <p className="ft-intro">A little curiosity brought you here.<br />Imagine where it could take you next.</p>
          <a className="ft-explore" href="#shop">Explore the collection <Arrow /></a>
          <p className="ft-signoff">There’s always more on the horizon.</p>
        </motion.div>

        <motion.div className="ft-directory" {...reveal}>
          <div className="ft-brand">
            <a className="ft-brand-name" href="#" onClick={(event) => { if (onTop) { event.preventDefault(); onTop(); } }}><span aria-hidden="true">▲</span> MUSEUM OF TOMORROW</a>
            <p>A home for impossible ideas.<br />Floating above the everyday.</p>
          </div>
          <nav className="ft-navigation" aria-label="Footer navigation">
            <p className="ft-label">KEEP EXPLORING</p>
            <a href="#story">Our vision <span>↗</span></a>
            <a href="#shop">The collection <span>↗</span></a>
          </nav>
          <div className="ft-visit">
            <p className="ft-label">MEET YOU ABOVE THE CLOUDS</p>
            <p className="ft-hours"><span /> Boarding daily</p>
            <p>09:00 — 23:00 <span className="ft-hours-note">/ including the night galleries</span></p>
          </div>
        </motion.div>

        <motion.div className="ft-word ft-word-depth" aria-hidden="true" initial={{ opacity: 0, rotateX: reducedMotion ? 0 : 35, y: reducedMotion ? 0 : 35 }} whileInView={{ opacity: 1, rotateX: 0, y: 0 }} viewport={{ once: true }} transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}>TOMORROW<span>✦</span></motion.div>
        <div className="ft-bar">
          <p>© 2150 Museum of Tomorrow</p>
          <span className="ft-last-note">THE FUTURE IS A BEAUTIFUL PLACE TO BEGIN.</span>
          <button type="button" onClick={onTop}>Back to the clouds <Arrow up /></button>
        </div>
      </div>
    </motion.footer>
  );
}

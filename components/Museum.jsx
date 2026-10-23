"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cam, chapters, products, shop } from "@/lib/data";
import Manifesto from "./Manifesto";
import Footer from "./Footer";
import { Lenses } from "./Landing";
import { ContainerTextFlip } from "@/components/ui/container-text-flip";
import { LiquidGlass } from "@/components/ui/liquid-glass";

const Scene = dynamic(() => import("./Scene"), { ssr: false });
const Shop = dynamic(() => import("./Shop"), { ssr: false });

const LOAD = 2; // seconds the preloader runs before the hero animates in
const rise = (d = 0) => ({
  initial: { opacity: 0, y: 40, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 1, delay: LOAD + d, ease: [0.2, 0.8, 0.2, 1] },
});
const inView = (d = 0) => ({
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-10%" },
  transition: { duration: 0.8, delay: d, ease: [0.2, 0.8, 0.2, 1] },
});

const WINDOWS = [[1.5, 3.2], [3.4, 5.2], [5.4, 7.2], [7.6, 9.2]]; // [start, end] of each chapter on the 0..10 timeline
const MARQUEE = "MUSEUM OF TOMORROW ✦ OPEN 2041 — 2150 ✦ FLOATING ABOVE THE CLOUDS ✦ ";

function Loader() {
  const [n, setN] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const c = { v: 0 };
    const t = gsap.to(c, { v: 100, duration: LOAD - 0.2, ease: "power2.inOut", onUpdate: () => setN(Math.round(c.v)), onComplete: () => setDone(true) });
    return () => t.kill();
  }, []);
  return (
    <AnimatePresence>
      {!done && (
        <motion.div className="loader" exit={{ yPercent: -100 }} transition={{ duration: 0.9, ease: [0.7, 0, 0.2, 1] }}>
          <span>▲ Museum of Tomorrow</span>
          <b>{n}</b>
          <i style={{ transform: `scaleX(${n / 100})` }} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Museum() {
  const [cart, setCart] = useState([]);
  const [toast, setToast] = useState(null);
  const timer = useRef();
  const lenisRef = useRef();
  const [idx, setIdx] = useState(0); // product in focus on the gallery shelf
  const [open, setOpen] = useState(null); // product shown in the detail modal
  const view = (p) => { setOpen(p); lenisRef.current?.[p ? "stop" : "start"](); };
  const add = (p) => {
    setCart((c) => [...c, p]);
    setToast({ ...p, key: Date.now() });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2200);
  };

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const lenis = (lenisRef.current = new Lenis());
    lenis.stop(); // locked while the preloader plays
    const unlock = setTimeout(() => lenis.start(), LOAD * 1000);
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // custom cursor (mouse only)
    let onMove, onOver;
    if (matchMedia("(pointer: fine)").matches) {
      const xTo = gsap.quickTo(".cursor", "x", { duration: 0.35, ease: "power3" });
      const yTo = gsap.quickTo(".cursor", "y", { duration: 0.35, ease: "power3" });
      onMove = (e) => { xTo(e.clientX); yTo(e.clientY); };
      onOver = (e) => document.querySelector(".cursor")?.classList.toggle("big", !!e.target.closest("a,button"));
      addEventListener("mousemove", onMove);
      addEventListener("mouseover", onOver);
    }

    const ctx = gsap.context(() => {
      gsap.to(cam, { intro: 0, duration: 3, delay: LOAD - 0.4, ease: "power3.out" });

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: { trigger: ".story", start: "top top", end: "bottom bottom", scrub: 1.2 },
      });
      tl.to(".hero-copy", { autoAlpha: 0, y: -80, duration: 1.1, ease: "power2.in" }, 0)
        .to(".hint", { autoAlpha: 0, duration: 0.4 }, 0)
        .fromTo(".prog i", { scaleY: 0 }, { scaleY: 1, duration: 10, ease: "none" }, 0)
        // camera path: dive -> side -> facade -> rotors from above -> night pull-back -> exit
        .to(cam, { cx: 1.4, cy: 1.2, cz: 10.5, tx: -1, ty: 0.6, ix: 0, ry: 0.4, duration: 1.5 }, 0)
        .to(cam, { cx: 2.6, cy: 1.0, cz: 9, tx: -2, ty: 0.6, ry: 0.9, duration: 1.5 }, 1.5)
        .to(cam, { cx: -2.4, cy: 1.8, cz: 5.6, tx: 1.6, ty: 1.4, ry: 0, duration: 1.8 }, 3)
        .to(cam, { cx: 3, cy: 5.2, cz: 6.5, tx: -2.4, ty: 2.2, ry: 0.8, duration: 1.8 }, 5)
        .to(cam, { cx: -2.8, cy: 0.6, cz: 11, tx: 2.4, ty: 0.6, ry: 2.4, duration: 1.8 }, 7)
        .to(cam, { cx: 0, cy: 3, cz: 19, tx: 0, ty: 0, ry: 3.4, duration: 1 }, 9)
        .to(cam, { night: 1, duration: 2, ease: "none" }, 6.5)
        .to(".sky", { "--a": "#5b4aa8", "--b": "#f08a6b", "--c": "#ffd29a", duration: 1, ease: "none" }, 6)
        .to(".sky", { "--a": "#070b24", "--b": "#1b1f5c", "--c": "#3a2a7a", duration: 1.5, ease: "none" }, 7)
        .to(".sun, .rays", { autoAlpha: 0, duration: 1.4, ease: "none" }, 6)
        .to(".scene-wrap", { opacity: 0.4, duration: 1 }, 9);

      WINDOWS.forEach(([a, b], i) => {
        const s = `.c${i}`;
        tl.fromTo(s, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, a)
          .fromTo(`${s} .ln>span`, { yPercent: 115, rotate: 4 }, { yPercent: 0, rotate: 0, duration: 0.6, stagger: 0.12, ease: "power3.out" }, a)
          .fromTo(`${s} .body`, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.5 }, a + 0.25)
          .to(`${s} .ln>span`, { yPercent: -115, duration: 0.4, stagger: 0.06, ease: "power3.in" }, b - 0.4)
          .to(s, { autoAlpha: 0, duration: 0.3 }, b - 0.3);
      });

      // marquee speeds/reverses with scroll velocity feel
      gsap.to(".marquee div", { xPercent: -50, ease: "none", scrollTrigger: { trigger: ".marquee", start: "top bottom", end: "bottom top", scrub: 0.5 } });

      // shop: pinned shelf slides sideways; island scene fades away
      gsap.to(shop, { p: 1, ease: "none", scrollTrigger: { trigger: ".shop", start: "top top", end: "bottom bottom", scrub: 1,
        onUpdate: (st) => setIdx(Math.round(st.progress * (products.length - 1))) } });
      gsap.fromTo(shop, { enter: 0 }, { enter: 1, ease: "none", scrollTrigger: { trigger: ".shop", start: "top 75%", end: "top top", scrub: true } });
      gsap.fromTo(".shop-bar i", { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: ".shop", start: "top top", end: "bottom bottom", scrub: true } });
      gsap.fromTo(".scene-fade", { opacity: 1 }, { opacity: 0, immediateRender: false, scrollTrigger: { trigger: ".shop", start: "top bottom", end: "top top", scrub: true } });
      gsap.from(".shop-head > *, .shop-info", { y: 60, autoAlpha: 0, stagger: 0.12, duration: 1, ease: "power3.out", scrollTrigger: { trigger: ".shop", start: "top 40%" } });
    });

    return () => {
      ctx.revert();
      clearTimeout(unlock);
      gsap.ticker.remove(tick);
      lenis.destroy();
      if (onMove) { removeEventListener("mousemove", onMove); removeEventListener("mouseover", onOver); }
    };
  }, []);

  return (
    <>
      <Loader />
      <div className="cursor" />
      <div className="sky"><div className="sun" /><div className="rays" /></div>
      <div className="scene-wrap"><div className="scene-fade"><Scene /></div></div>

      <motion.nav className="nav" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: LOAD }}>
        <a className="logo" href="#">▲ MUSEUM OF TOMORROW</a>
        <LiquidGlass className="col-start-2 hidden lg:block" contentClassName="links" radius={999} scale={36} frost={2} tint={0.08}>
          <a href="#story">Experience</a><a href="#shop">Collection</a><a href="#visit">Visit</a>
        </LiquidGlass>
        <a className="pill ghost" href="#shop">
          Cart
          <motion.span className="count" key={cart.length} initial={{ scale: 1.8 }} animate={{ scale: 1 }}>{cart.length}</motion.span>
        </a>
      </motion.nav>

      <AnimatePresence>
        {toast && (
          <motion.div key={toast.key} className="toast" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
            <i style={{ background: toast.color }} /> {toast.name} added · total ${cart.reduce((s, p) => s + p.price, 0)}
          </motion.div>
        )}
      </AnimatePresence>

      <section className="story" id="story">
        <div className="stage">
          <div className="hero-copy">
            <motion.p className="eyebrow" {...rise()}>DISCOVER · IMAGINE · REMEMBER</motion.p>
            <h1>
              <span className="ln"><motion.span initial={{ yPercent: 110 }} animate={{ yPercent: 0 }} transition={{ duration: 1.1, delay: LOAD + 0.1, ease: [0.2, 0.8, 0.2, 1] }}>Somewhere</motion.span></span>
              <span className="ln"><motion.span initial={{ yPercent: 110 }} animate={{ yPercent: 0 }} transition={{ duration: 1.1, delay: LOAD + 0.22, ease: [0.2, 0.8, 0.2, 1] }}>beyond <em>possible.</em></motion.span></span>
            </h1>
            <motion.div className="lede" {...rise(0.4)}>
              A floating museum of{" "}
              <ContainerTextFlip words={["inventions", "artifacts", "memories", "futures"]} className="!mx-1 !px-3 !pt-0.5 !pb-1.5 !align-middle !text-[1.45em] !font-normal !text-white dark:![background:linear-gradient(180deg,rgba(255,255,255,.22),rgba(255,255,255,.08))] dark:!shadow-[inset_0_0_0_1px_rgba(255,255,255,.35),0_8px_24px_rgba(20,40,90,.25)] backdrop-blur-md" textClassName="font-serif italic" />
              <br />that don't exist yet. Scroll to fly in.
            </motion.div>
            <motion.div className="cta" {...rise(0.5)}>
              <a className="pill solid" href="#shop">Visit the Shop →</a>
              <a className="pill ghost" href="#story">▶ Watch Tour</a>
            </motion.div>
            <motion.span className="note" initial={{ opacity: 0, rotate: 30, scale: 0.6 }} animate={{ opacity: 0.9, rotate: 12, scale: 1 }} transition={{ delay: LOAD + 0.8, type: "spring" }}>
              Dream<br />Bigger<br />Days ☺
            </motion.span>
          </div>

          {chapters.map((c, i) => (
            <div key={i} className={`chap c${i} ${c.side}`}>
              <div className="inner">
                <p className="eyebrow">{c.tag.toUpperCase()}</p>
                <h2>{c.lines.map((l, j) => <span className="ln" key={j}><span dangerouslySetInnerHTML={{ __html: l }} /></span>)}</h2>
                <p className="body">{c.text}</p>
              </div>
            </div>
          ))}

          <div className="prog"><i /></div>
          <span className="hint">Scroll</span>
        </div>
      </section>

      <div className="marquee"><div>{MARQUEE.repeat(6)}</div></div>

      <Manifesto />


      <section className="shop" id="shop">
        <div className="shop-stage">
          <div className="shop-canvas"><Shop /></div>
          <div className="shop-head">
            <p className="eyebrow">THE COLLECTION · MUSEUM SHOP</p>
            <h2 className="big2">Treasures from <em>every tomorrow.</em></h2>
          </div>
          <div className="shop-info" style={{ "--c": products[idx].color }}>
            <div className="shop-count"><b>{products[idx].id}</b><span>/ 0{products.length}</span></div>
            <AnimatePresence mode="wait">
              <motion.div key={idx} initial={{ opacity: 0, y: 24, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -16, filter: "blur(6px)" }} transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}>
                <p className="kind">{products[idx].kind} · {products[idx].era}</p>
                <h3>{products[idx].name}</h3>
                <p className="blurb">{products[idx].blurb}</p>
                <div className="buy">
                  <b>{products[idx].price}</b>
                  <button className="pill solid" onClick={() => add(products[idx])}>Add to cart +</button>
                  <button className="pill ghost" onClick={() => view(products[idx])}>View</button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="shop-dots">
            {products.map((p, i) => <i key={p.id} className={i === idx ? "on" : ""} style={{ "--c": p.color }} />)}
          </div>
          <div className="shop-bar"><i /></div>
        </div>
      </section>

      <AnimatePresence>
        {open && (
          <motion.div className="modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => view(null)} data-lenis-prevent>
            <motion.div className="modal-card" style={{ "--c": open.color }} onClick={(e) => e.stopPropagation()}
              initial={{ y: 60, scale: 0.94, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 40, scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", damping: 24, stiffness: 220 }}>
              <motion.img src={open.img} alt={open.name} initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }} />
              <div className="modal-body">
                <p className="kind">{open.id} · {open.kind} · {open.era}</p>
                <h3>{open.name}</h3>
                <p className="blurb">{open.blurb}</p>
                <ul>
                  <li><span>Provenance</span>Museum of Tomorrow archive</li>
                  <li><span>Shipping</span>By rotor courier, insured</li>
                  <li><span>Certificate</span>Signed by the curator</li>
                </ul>
                <div className="buy">
                  <b>{open.price}</b>
                  <button className="pill solid" onClick={() => { add(open); view(null); }}>Add to cart +</button>
                </div>
              </div>
              <button className="close" onClick={() => view(null)} aria-label="Close">×</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Lenses />

      <Footer onTop={() => lenisRef.current?.scrollTo(0, { duration: 2.4 })} />
    </>
  );
}

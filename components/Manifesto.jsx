"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Sentence as data: strings are plain words, { hl } words shimmer, { img } opens a photo pill inside the line.
const LINES = [
  ["Every", "invention"],
  ["begins", "as", "a", { img: "/products/3.webp" }, { hl: "story" }],
  ["someone", "dared", "to", "tell."],
  ["We", "collect", "the", { hl: "ones" }],
  ["that", "haven't", { img: "/products/1.webp" }, { hl: "happened" }],
];
const FLOATERS = ["/products/2.webp", "/products/4.webp", "/products/5.webp", "/products/1.webp"];

const Chars = ({ text }) => [...text].map((c, i) => <span className="ch" key={i}>{c}</span>);

export default function Manifesto() {
  const root = useRef();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const el = root.current;
    const stage = el.querySelector(".mf-stage");
    const move = (e) => {
      stage.style.setProperty("--mx", `${e.clientX}px`);
      stage.style.setProperty("--my", `${e.clientY}px`);
    };
    stage.addEventListener("mousemove", move);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" }, scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: 1 } });
      // 1. letters flip up out of the floor, blurred -> sharp
      tl.from(".mf-top", { autoAlpha: 0, y: 20, duration: 0.3 }, 0)
        .fromTo(".mf-lines .ch", { yPercent: 120, rotateX: -95, opacity: 0, filter: "blur(10px)" },
          { yPercent: 0, rotateX: 0, opacity: 1, filter: "blur(0px)", duration: 0.5, stagger: 0.022 }, 0.1)
        // 2. photo pills open inside the sentence
        .fromTo(".pimg", { width: 0, marginInline: 0 }, { width: "1.8em", marginInline: "0.12em", duration: 0.7, stagger: 1.0, ease: "power2.inOut" }, 0.9)
        .fromTo(".pimg img", { scale: 1.8 }, { scale: 1, duration: 0.9, stagger: 1.0 }, 0.9)
        // floating photos drift past at different depths
        .fromTo(".mf-float", { y: (i) => 300 + i * 120, rotate: (i) => (i % 2 ? 8 : -8) }, { y: (i) => -400 - i * 160, rotate: (i) => (i % 2 ? -6 : 6), duration: 4.2, ease: "none" }, 0)
        // 3. sentence recedes, "yet." arrives as an outline and fills with light
        .to(".mf-lines", { scale: 0.88, opacity: 0.1, filter: "blur(8px)", duration: 0.6, ease: "power2.in" }, 3.1)
        .fromTo(".mf-yet", { scale: 0.25, autoAlpha: 0, rotate: -6 }, { scale: 1, autoAlpha: 1, rotate: 0, duration: 0.7 }, 3.3)
        .fromTo(".mf-yet .fill", { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 0.6, ease: "none" }, 3.9)
        // 4. zoom straight through the word into the next section
        .to(".mf-yet", { scale: 28, duration: 1.1, ease: "power3.in" }, 4.7)
        .to(".mf-yet", { autoAlpha: 0, duration: 0.25, ease: "none" }, 5.55)
        .to(".mf-lines, .mf-top, .mf-bottom", { autoAlpha: 0, duration: 0.3, ease: "none" }, 4.7);
    }, el);

    return () => {
      stage.removeEventListener("mousemove", move);
      ctx.revert();
    };
  }, []);

  return (
    <section className="mf" ref={root}>
      <div className="mf-stage">
        <div className="mf-aurora"><i /><i /><i /></div>
        {FLOATERS.map((src, i) => <img key={i} className={`mf-float f${i}`} src={src} alt="" />)}
        <p className="mf-top"><span>— Manifesto</span><span>Nº 2150</span></p>
        <h2 className="mf-lines">
          {LINES.map((line, li) => (
            <span className="mf-line" key={li}>
              {line.map((w, wi) =>
                w.img ? (
                  <span className="pimg" key={wi}><img src={w.img} alt="" /></span>
                ) : (
                  <span className={`wd${w.hl ? " hl" : ""}`} key={wi}><Chars text={w.hl || w} /></span>
                )
              )}
            </span>
          ))}
        </h2>
        <div className="mf-yet" aria-hidden>
          <span className="stroke">yet.</span>
          <span className="fill">yet.</span>
        </div>
        <p className="mf-bottom">Keep scrolling — the collection is next</p>
      </div>
    </section>
  );
}

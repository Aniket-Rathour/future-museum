"use client";
import { motion } from "framer-motion";

export function Tagline({ children }) {
  return (
    <motion.span
      className="tagline"
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ type: "spring", damping: 16, stiffness: 180 }}
    >
      <i className="tagline-dot" />
      {children}
    </motion.span>
  );
}

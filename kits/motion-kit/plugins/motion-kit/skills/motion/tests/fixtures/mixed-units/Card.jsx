import { motion, useReducedMotion } from "motion/react";

export function Card({ el }) {
  const reduce = useReducedMotion();
  if (!reduce) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
  return <motion.div animate={{ y: 0 }} transition={{ duration: 0.3 }} />;
}

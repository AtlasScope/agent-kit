import { motion } from "motion/react";

export function Panel({ open }: { open: boolean }) {
  return (
    <div className="transition-all duration-700 ease-in hover:scale-105">
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      />
      <motion.span animate={{ x: 10 }} transition={{ duration: 0.8, ease: "easeIn" }} />
      <div className="animate-spin" />
    </div>
  );
}

import { motion } from "motion/react";

export const A = () => <div style={{ transition: "all 700ms ease-in" }} />;
export const B = () => <div style={{ transition: 'height 200ms ease-out' }} />;
export const C = () => <motion.div animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} />;

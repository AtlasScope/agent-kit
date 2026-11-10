import { useSpring, animated } from "@react-spring/web";
import { useReducedMotion } from "./motion";

export function Fade() {
  const reduce = useReducedMotion();
  const style = useSpring({ opacity: 1, config: { duration: 250 }, immediate: reduce });
  return <animated.div style={style} />;
}

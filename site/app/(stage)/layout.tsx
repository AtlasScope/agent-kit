import { Stage } from "@/components/stage/Stage";
import "./stage.css";

// The homepage and the install page share one view from orbit. It sits in this layout so it stays up while the
// router swaps one page for the other (components/stage/Stage.tsx plays the move between them).
export default function StageLayout({ children }: { children: React.ReactNode }) {
  return <Stage>{children}</Stage>;
}

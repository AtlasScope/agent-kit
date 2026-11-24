"use client";
import { useRef } from "react";
import { CopyButton } from "@/components/CopyButton";
import { FloatingCopy } from "@/components/ui/FloatingCopy";

const CMD = "claude plugin marketplace add AtlasScope/agent-kit";

// The code block primitive with a FloatingCopy: scroll the block's Copy behind the header and the bar appears; it
// hides again once this section has scrolled past.
export function CodeWithFloat({ children }: { children?: React.ReactNode }) {
  const head = useRef<HTMLDivElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const pre = useRef<HTMLPreElement>(null);
  return (
    <div ref={end} className="ds-float">
      <div className="block">
        <div className="block__head" ref={head}><span>Terminal</span><CopyButton text={CMD} name="Copy the marketplace command" /></div>
        <pre ref={pre}>{CMD}</pre>
      </div>
      {children}
      <FloatingCopy anchor={head} end={end} target={pre} text={CMD} title="Add the marketplace" detail="Claude Code" name="Copy the marketplace command (floating bar)" />
    </div>
  );
}

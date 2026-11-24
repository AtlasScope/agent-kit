"use client";
import { useRef } from "react";
import { CopyButton } from "@/components/CopyButton";
import { FloatingCopy } from "@/components/ui/FloatingCopy";

const CMD = "claude plugin marketplace add AtlasScope/agent-kit";

// The code block primitive with a FloatingCopy: scroll the block's Copy behind the header and the bar appears.
export function CodeWithFloat() {
  const head = useRef<HTMLDivElement>(null);
  return (
    <>
      <div className="block">
        <div className="block__head" ref={head}><span>Terminal</span><CopyButton text={CMD} name="Copy the marketplace command" /></div>
        <pre>{CMD}</pre>
      </div>
      <FloatingCopy anchor={head} text={CMD} title="Add the marketplace" detail="Claude Code" name="Copy the marketplace command (floating bar)" />
    </>
  );
}

"use client";

import { useState } from "react";
import type { Message } from "@/lib/types";
import { useClinic } from "./ClinicStore";

export function ThreadView({ threadId, messages, me }: { threadId: string; messages: Message[]; me: string }) {
  const clinic = useClinic();
  const [text, setText] = useState("");
  const all = [...messages, ...(clinic.replies[threadId] ?? [])];

  return (
    <div className="card">
      <ul className="messages">
        {all.map((m, i) => (
          <li key={i} className={m.from === me ? "msg mine" : "msg"}>
            <div className="msg-from">{m.from} <span className="muted">{m.at.replace("T", " ")}</span></div>
            <p>{m.body}</p>
          </li>
        ))}
      </ul>
      <form
        className="reply"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          const now = new Date();
          clinic.reply(threadId, { from: me, at: now.toISOString().slice(0, 16), body: text.trim() });
          setText("");
        }}
      >
        <textarea className="input" rows={3} value={text} onChange={(e) => setText(e.target.value)} aria-label="Reply" placeholder="Write a reply…" />
        <button type="submit" className="btn primary" disabled={!text.trim()}>Send</button>
      </form>
    </div>
  );
}

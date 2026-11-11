export type StarProps = { kind: "prompt" | "skill"; refId: string; title: string; label?: boolean };

export const StarIcon = ({ on }: { on: boolean }) => (
  <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
    <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
  </svg>
);

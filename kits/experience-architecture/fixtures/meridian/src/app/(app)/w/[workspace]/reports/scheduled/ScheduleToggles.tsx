"use client";

import { useState } from "react";

export function ScheduleToggles({ id }: { id: string }) {
  const [on, setOn] = useState(!id.endsWith("claims"));
  return <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} aria-label="Active" />;
}

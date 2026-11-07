import Link from "next/link";
import { addDays, clinicDay, formatDate } from "@/lib/dates";

export function ScheduleNav({ date, view, clinician }: { date: string; view: "day" | "week"; clinician?: string }) {
  const step = view === "day" ? 1 : 7;
  const base = view === "day" ? "/schedule" : "/schedule/week";
  const q = (d: string) => `${base}?date=${d}${clinician ? `&clinician=${clinician}` : ""}`;
  return (
    <div className="schedule-nav">
      <div className="segmented" role="tablist" aria-label="Schedule view">
        <Link href={`/schedule?date=${date}`} className={view === "day" ? "seg active" : "seg"} role="tab" aria-selected={view === "day"}>Day</Link>
        <Link href={`/schedule/week?date=${date}`} className={view === "week" ? "seg active" : "seg"} role="tab" aria-selected={view === "week"}>Week</Link>
      </div>
      <div className="date-step">
        <Link href={q(addDays(date, -step))} className="btn ghost" aria-label="Previous">‹</Link>
        <span className="date-label">{formatDate(date, { weekday: "long", month: "long" })}</span>
        <Link href={q(addDays(date, step))} className="btn ghost" aria-label="Next">›</Link>
        {date !== clinicDay(0) && (
          <Link href={q(clinicDay(0))} className="btn ghost">Today</Link>
        )}
      </div>
    </div>
  );
}

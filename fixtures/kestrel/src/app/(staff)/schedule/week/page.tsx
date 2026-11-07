import type { Metadata } from "next";
import Link from "next/link";
import { ScheduleNav } from "@/components/ScheduleNav";
import { PageHeader } from "@/components/ui";
import { appointmentsBetween, clinicians, findPatient } from "@/lib/data";
import { addDays, clinicDay, formatDate, formatTime, isValidDate, weekStart } from "@/lib/dates";

export const metadata: Metadata = { title: "Week" };

export default async function WeekPage({ searchParams }: { searchParams: Promise<{ date?: string; clinician?: string }> }) {
  const sp = await searchParams;
  const date = isValidDate(sp.date) ? sp.date : clinicDay(0);
  const start = weekStart(date);
  const days = Array.from({ length: 5 }, (_, i) => addDays(start, i));
  const appts = appointmentsBetween(start, 7).filter((a) => !sp.clinician || a.clinicianId === sp.clinician);

  return (
    <div>
      <PageHeader title="Schedule" subtitle={`Week of ${formatDate(start)}`} />
      <ScheduleNav date={date} view="week" clinician={sp.clinician} />
      <div className="week">
        {days.map((d) => {
          const list = appts.filter((a) => a.date === d).sort((a, b) => a.start.localeCompare(b.start));
          return (
            <section key={d} className="week-day">
              <h2><Link href={`/schedule?date=${d}`}>{formatDate(d)}</Link></h2>
              {list.length === 0 && <p className="empty">No appointments</p>}
              <ul>
                {list.map((a) => {
                  const pt = findPatient(a.patientId);
                  const c = clinicians.find((x) => x.id === a.clinicianId);
                  return (
                    <li key={a.id} style={{ borderLeftColor: c?.color }}>
                      <Link href={`/schedule/appointments/${a.id}`}>
                        <span className="appt-time">{formatTime(a.start)}</span> {pt?.firstName} {pt?.lastName}
                        <span className="muted"> · {c?.shortName}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

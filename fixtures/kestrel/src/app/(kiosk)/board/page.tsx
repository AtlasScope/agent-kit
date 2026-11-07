import type { Metadata } from "next";
import { BoardClock } from "@/components/BoardClock";
import { appointmentsOn, CLINIC, findPatient, findRoom } from "@/lib/data";
import { clinicDay } from "@/lib/dates";

export const metadata: Metadata = { title: "Waiting room" };
export const dynamic = "force-dynamic";

export default function BoardPage() {
  const list = appointmentsOn(clinicDay(0))
    .filter((a) => a.status === "arrived" || a.status === "ready" || a.status === "in_room")
    .map((a, i) => {
      const pt = findPatient(a.patientId);
      return {
        ticket: `${String.fromCharCode(65 + (i % 26))}${(i + 1).toString().padStart(2, "0")}`,
        display: pt ? `${pt.firstName} ${pt.lastName[0]}.` : "Guest",
        called: a.status === "in_room" || a.status === "ready",
        room: a.status === "in_room" ? findRoom(a.roomId)?.name : undefined,
      };
    });

  return (
    <div className="board-screen">
      <header>
        <h1>{CLINIC.name}</h1>
        <BoardClock />
      </header>
      <ul className="board-tickets">
        {list.map((r) => (
          <li key={r.ticket} className={r.called ? "called" : ""}>
            <span className="ticket">{r.ticket}</span>
            <span className="who">{r.display}</span>
            <span className="where">{r.room ? `Please go to ${r.room}` : r.called ? "Nearly ready" : "Please take a seat"}</span>
          </li>
        ))}
      </ul>
      <footer>Not on the board? Please see the front desk.</footer>
    </div>
  );
}

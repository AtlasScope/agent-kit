"use client";

import Link from "next/link";
import { useState } from "react";
import type { Carrier, Location } from "@/lib/data";
import { Card } from "@/components/ui";
import { useToast } from "@/components/Toast";

export function NewShipmentForm({ workspace, carriers, locations }: { workspace: string; carriers: Carrier[]; locations: Location[] }) {
  const toast = useToast();
  const [form, setForm] = useState({
    reference: "",
    customer: "",
    origin: locations[0]?.id ?? "",
    destination: "",
    carrier: carriers[0]?.id ?? "",
    pickup: "2026-11-10",
    weight: "",
    pieces: "1",
    notes: "",
  });
  const [saved, setSaved] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  if (saved) {
    return (
      <Card title="Shipment booked">
        <p>
          {saved} was booked and tendered. It will appear in the shipment list once the carrier accepts.
        </p>
        <div className="row" style={{ marginTop: 12 }}>
          <Link className="btn btn-primary" href={`/w/${workspace}/shipments`}>
            Back to shipments
          </Link>
          <button className="btn" onClick={() => setSaved(null)}>
            Book another
          </button>
        </div>
      </Card>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const id = `SHP-${2000 + Math.floor(Math.random() * 900)}`;
        setSaved(id);
        toast(`${id} booked (demo)`);
      }}
    >
      <Card title="Load details">
        <div className="grid grid-3">
          <div className="field">
            <label>Customer PO</label>
            <input className="input" value={form.reference} onChange={set("reference")} placeholder="PO-51234" required />
          </div>
          <div className="field">
            <label>Customer</label>
            <input className="input" value={form.customer} onChange={set("customer")} required />
          </div>
          <div className="field">
            <label>Pickup date</label>
            <input className="input" type="date" value={form.pickup} onChange={set("pickup")} />
          </div>
          <div className="field">
            <label>Origin</label>
            <select className="select" value={form.origin} onChange={set("origin")}>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Destination address</label>
            <input className="input" value={form.destination} onChange={set("destination")} required />
          </div>
          <div className="field">
            <label>Carrier</label>
            <select className="select" value={form.carrier} onChange={set("carrier")}>
              {carriers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Weight (kg)</label>
            <input className="input" inputMode="numeric" value={form.weight} onChange={set("weight")} />
          </div>
          <div className="field">
            <label>Pieces</label>
            <input className="input" inputMode="numeric" value={form.pieces} onChange={set("pieces")} />
          </div>
        </div>
        <div className="field" style={{ marginTop: 14 }}>
          <label>Handling notes</label>
          <textarea className="textarea" value={form.notes} onChange={set("notes")} />
        </div>
        <div className="row" style={{ marginTop: 14 }}>
          <button className="btn btn-primary" type="submit">
            Book and tender
          </button>
          <Link className="btn" href={`/w/${workspace}/shipments`}>
            Cancel
          </Link>
        </div>
      </Card>
    </form>
  );
}

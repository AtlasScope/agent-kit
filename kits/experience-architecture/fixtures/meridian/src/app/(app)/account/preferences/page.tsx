"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { workspaces } from "@/lib/data";
import { SaveBar } from "../SaveBar";

export default function PreferencesPage() {
  const [units, setUnits] = useState("kg");
  const [home, setHome] = useState("acme");
  const [density, setDensity] = useState("comfortable");
  return (
    <Card title="Preferences">
      <div className="grid grid-3">
        <div className="field">
          <label>Weight units</label>
          <select className="select" value={units} onChange={(e) => setUnits(e.target.value)}>
            <option value="kg">Kilograms</option>
            <option value="lb">Pounds</option>
          </select>
        </div>
        <div className="field">
          <label>Default workspace</label>
          <select className="select" value={home} onChange={(e) => setHome(e.target.value)}>
            {workspaces.map((w) => (
              <option key={w.slug} value={w.slug}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Table density</label>
          <select className="select" value={density} onChange={(e) => setDensity(e.target.value)}>
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </select>
        </div>
      </div>
      <SaveBar message="Preferences saved" />
    </Card>
  );
}

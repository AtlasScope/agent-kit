"use client";

import { useState } from "react";
import { CURRENT_USER } from "@/lib/data";
import { Card } from "@/components/ui";
import { SaveBar } from "../SaveBar";

export default function ProfilePage() {
  const [name, setName] = useState(CURRENT_USER.name);
  const [title, setTitle] = useState("Director of Operations");
  const [phone, setPhone] = useState("+1 312 555 0142");
  return (
    <Card title="Profile">
      <div className="grid grid-2">
        <div className="field">
          <label>Full name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Email</label>
          <input className="input" value={CURRENT_USER.email} disabled />
        </div>
        <div className="field">
          <label>Job title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label>Mobile</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>
      <SaveBar message="Profile saved" />
    </Card>
  );
}

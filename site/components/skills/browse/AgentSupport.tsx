import Link from "next/link";
import { agentSupport } from "./data";

// Which agents have an install path, from AGENTS in lib/site.ts. A lit LED means a clean-environment install was
// recorded for that agent (its scope and date are in the tooltip and on /install); unlit means documented only.
export function AgentSupport({ only }: { only?: "plugin" }) {
  const list = only === "plugin" ? agentSupport.filter((a) => a.plugin) : agentSupport;
  return (
    <div className="agents">
      <p className="agents__h" id={`agents-${only ?? "all"}`}>{only === "plugin" ? "Installs as a plugin in" : "Installs into"}</p>
      <ul className="agents__list" aria-labelledby={`agents-${only ?? "all"}`}>
        {list.map((a) => {
          const note = a.tested ? `${a.scope ?? "Install tested"}: ${a.tested}` : "Documented, not yet tested";
          return (
            <li key={a.id} title={note}>
              <i className={a.tested ? "led is-on" : "led"} aria-hidden="true" />
              <span>{a.label}</span>
              <span className="sr">({a.tested ? "install tested" : "not yet tested"})</span>
            </li>
          );
        })}
      </ul>
      <p className="agents__key"><i className="led is-on" aria-hidden="true" /> install tested · <Link className="lic" href="/install">steps and test dates</Link></p>
    </div>
  );
}

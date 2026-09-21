import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";

export default function Populate() {
  const { permissions } = useAuth();
  const [packs, setPacks] = useState(null);
  const [resources, setResources] = useState([]);
  const [busy, setBusy] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // Paste-your-own state
  const [target, setTarget] = useState("universities");
  const [json, setJson] = useState("");

  useEffect(() => {
    Promise.all([api.get("/seed/packs"), api.get("/resources")])
      .then(([p, r]) => {
        setPacks(p.packs);
        setResources(r.resources.filter((x) => x.canCreate));
      })
      .catch((e) => setError(e.message));
  }, []);

  const run = async (label, fn) => {
    setBusy(label);
    setError("");
    setResult(null);
    try {
      setResult(await fn());
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };

  const runPack = (key, label, count) => {
    if (!confirm(`Import ${count} records from “${label}”?\n\nRecords that already exist are skipped, so this is safe to run more than once.`)) return;
    run(key, () => api.post(`/seed/packs/${key}`));
  };

  const runPaste = () => {
    let parsed;
    try {
      parsed = JSON.parse(json);
    } catch (e) {
      setError(`That is not valid JSON: ${e.message}`);
      return;
    }
    const rows = Array.isArray(parsed) ? parsed : parsed.rows;
    if (!Array.isArray(rows) || rows.length === 0) {
      setError("Expected a JSON array of records, or {\"rows\": [...]}.");
      return;
    }
    run("paste", () => api.post(`/seed/import/${target}`, rows));
  };

  const schema = resources.find((r) => r.key === target);

  if (!packs && !error) return <div className="empty">Loading…</div>;
  if (!permissions?.write) {
    return (
      <>
        <h1>Populate</h1>
        <div className="msg err mt">
          Your role is read-only, so importing is disabled.
        </div>
      </>
    );
  }

  return (
    <>
      <h1>Populate</h1>
      <p className="dim">
        Load reference data in bulk instead of inserting it into the database by
        hand. Existing records are skipped, so every import is safe to re-run.
      </p>

      {error && <div className="msg err mt">{error}</div>}
      {result && <ImportResult result={result} />}

      <div className="card mt">
        <h2>Bundled data</h2>
        <p className="dim" style={{ fontSize: 12.5, marginTop: 4 }}>
          Curated and shipped with the codebase.
        </p>
        {packs?.length === 0 && <p className="dim">No packs available.</p>}
        {packs?.map((p) => (
          <div
            key={p.key}
            className="row spread"
            style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 12 }}
          >
            <div style={{ minWidth: 0 }}>
              <strong>{p.label}</strong>{" "}
              <span className="pill">{p.count} records</span>
              <p className="dim" style={{ fontSize: 12.5, margin: "4px 0 0" }}>
                {p.description}
              </p>
            </div>
            <button
              className="primary"
              disabled={!!busy}
              onClick={() => runPack(p.key, p.label, p.count)}
            >
              {busy === p.key ? "Importing…" : "Import"}
            </button>
          </div>
        ))}
      </div>

      <div className="card mt">
        <h2>Paste JSON</h2>
        <p className="dim" style={{ fontSize: 12.5, marginTop: 4 }}>
          An array of objects, up to 500 at a time. IDs are generated; unknown
          keys are ignored.
        </p>

        <div className="field mt">
          <label htmlFor="target">Import into</label>
          <select id="target" value={target} onChange={(e) => setTarget(e.target.value)}>
            {resources.map((r) => (
              <option key={r.key} value={r.key}>{r.label}</option>
            ))}
          </select>
        </div>

        {schema && (
          <p className="dim" style={{ fontSize: 12, marginTop: -4 }}>
            Required: <code>{schema.required.join(", ") || "none"}</code>
            <br />
            Accepted: <code>{schema.columns.join(", ")}</code>
          </p>
        )}

        <div className="field">
          <label htmlFor="json">Records</label>
          <textarea
            id="json"
            rows={9}
            spellCheck={false}
            value={json}
            placeholder={'[\n  { "name": "Example University", "domain": "example.edu.gh", "city": "Accra" }\n]'}
            onChange={(e) => setJson(e.target.value)}
            style={{ fontFamily: "ui-monospace, monospace", fontSize: 12.5 }}
          />
        </div>

        <div className="row spread">
          <button type="button" disabled={!json.trim()} onClick={() => setJson("")}>
            Clear
          </button>
          <button className="primary" disabled={!!busy || !json.trim()} onClick={runPaste}>
            {busy === "paste" ? "Importing…" : "Import records"}
          </button>
        </div>
      </div>
    </>
  );
}

function ImportResult({ result }) {
  const [open, setOpen] = useState(false);
  const { inserted, skipped, failed, details } = result;

  return (
    <div className={`msg ${failed ? "err" : "ok"} mt`} style={{ padding: 12 }}>
      <div className="row spread">
        <span>
          <strong>{inserted}</strong> added
          {skipped > 0 && <> · <strong>{skipped}</strong> already existed</>}
          {failed > 0 && <> · <strong>{failed}</strong> failed</>}
        </span>
        {details?.length > 0 && (
          <button className="sm" onClick={() => setOpen(!open)}>
            {open ? "Hide detail" : "Show detail"}
          </button>
        )}
      </div>

      {open && (
        <div className="table-wrap" style={{ marginTop: 10, maxHeight: 320, overflowY: "auto" }}>
          <table>
            <thead>
              <tr><th>#</th><th>Record</th><th>Result</th><th>Note</th></tr>
            </thead>
            <tbody>
              {details.map((d) => (
                <tr key={d.row}>
                  <td className="dim">{d.row}</td>
                  <td className="clip">{d.name}</td>
                  <td>
                    <span className={`pill ${d.status === "inserted" ? "on" : "off"}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="dim clip">{d.reason || d.id || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

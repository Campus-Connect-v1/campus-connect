import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";

// Seeded and self-registered universities arrive unverified. Accreditation is a
// human judgement, so they queue here until an operator approves them.
export default function Approvals() {
  const { permissions } = useAuth();
  const [tab, setTab] = useState("pending"); // pending | approved
  const [rows, setRows] = useState(null);
  const [total, setTotal] = useState(0);
  const [picked, setPicked] = useState(() => new Set());
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    setPicked(new Set());
    try {
      const qs = new URLSearchParams({
        limit: 200,
        is_verified: tab === "approved" ? 1 : 0,
      });
      const d = await api.get(`/universities?${qs}`);
      setRows(d.rows);
      setTotal(d.total);
    } catch (e) {
      setError(e.message);
      setRows([]);
    }
  }, [tab]);

  useEffect(() => {
    setRows(null);
    load();
  }, [load]);

  const toggle = (id) => {
    const next = new Set(picked);
    next.has(id) ? next.delete(id) : next.add(id);
    setPicked(next);
  };

  const allPicked = rows?.length > 0 && picked.size === rows.length;

  const apply = async (verified) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { updated } = await api.post("/seed/verify", {
        ids: [...picked],
        is_verified: verified,
      });
      setNotice(
        `${updated} ${updated === 1 ? "university" : "universities"} ${
          verified ? "approved" : "moved back to pending"
        }.`
      );
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h1>Approvals</h1>
      <p className="dim">
        Universities start unapproved. Approving one marks it verified for
        students browsing the app.
      </p>

      <div className="row mt">
        {["pending", "approved"].map((t) => (
          <button
            key={t}
            className={tab === t ? "primary" : ""}
            onClick={() => setTab(t)}
          >
            {t === "pending" ? "Pending" : "Approved"}
          </button>
        ))}
        <span className="dim">{total.toLocaleString()} total</span>
      </div>

      {error && <div className="msg err mt">{error}</div>}
      {notice && <div className="msg ok mt">{notice}</div>}

      {permissions?.write && picked.size > 0 && (
        <div className="card mt row spread" style={{ padding: 12 }}>
          <span>
            <strong>{picked.size}</strong> selected
          </span>
          <div className="row">
            <button onClick={() => setPicked(new Set())}>Clear</button>
            {tab === "pending" ? (
              <button className="primary" disabled={busy} onClick={() => apply(true)}>
                {busy ? "Working…" : `Approve ${picked.size}`}
              </button>
            ) : (
              <button className="danger" disabled={busy} onClick={() => apply(false)}>
                {busy ? "Working…" : `Unapprove ${picked.size}`}
              </button>
            )}
          </div>
        </div>
      )}

      {rows === null ? (
        <div className="empty">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="table-wrap mt">
          <div className="empty">
            {tab === "pending"
              ? "Nothing waiting for approval."
              : "No approved universities yet."}
          </div>
        </div>
      ) : (
        <div className="table-wrap mt">
          <table>
            <thead>
              <tr>
                {permissions?.write && (
                  <th style={{ width: 34 }}>
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      checked={allPicked}
                      onChange={() =>
                        setPicked(
                          allPicked
                            ? new Set()
                            : new Set(rows.map((r) => r.university_id))
                        )
                      }
                      style={{ width: "auto" }}
                    />
                  </th>
                )}
                <th>ID</th>
                <th>Name</th>
                <th>Email domain</th>
                <th>City</th>
                <th>Region</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.university_id}>
                  {permissions?.write && (
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Select ${r.name}`}
                        checked={picked.has(r.university_id)}
                        onChange={() => toggle(r.university_id)}
                        style={{ width: "auto" }}
                      />
                    </td>
                  )}
                  <td className="dim">{r.university_id}</td>
                  <td>{r.name}</td>
                  <td><code>{r.domain}</code></td>
                  <td className="dim">{r.city || "—"}</td>
                  <td className="dim">{r.state || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

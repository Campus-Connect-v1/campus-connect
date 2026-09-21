import { useEffect, useState } from "react";
import { api, formatValue } from "../api.js";

export default function Activity() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/activity?limit=100")
      .then((d) => setRows(d.activity))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="msg err">{error}</div>;
  if (!rows) return <div className="empty">Loading…</div>;

  return (
    <>
      <h1>Activity</h1>
      <p className="dim">Most recent 100 audit entries.</p>

      {rows.length === 0 ? (
        <div className="table-wrap mt">
          <div className="empty">
            Nothing recorded yet. Entries appear here as the app writes to
            <code> audit_logs</code>.
          </div>
        </div>
      ) : (
        <div className="table-wrap mt">
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Action</th>
                <th>Resource</th>
                <th>User</th>
                <th>Description</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.log_id}>
                  <td>{formatValue(r.created_at)}</td>
                  <td>{r.action_type}</td>
                  <td className="dim">
                    {r.resource_type}
                    {r.resource_id ? ` · ${r.resource_id}` : ""}
                  </td>
                  <td className="dim">{formatValue(r.user_id)}</td>
                  <td className="clip">{formatValue(r.description)}</td>
                  <td className="dim">{formatValue(r.ip_address)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

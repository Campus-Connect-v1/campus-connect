import { useEffect, useState } from "react";
import { api, humanize } from "../api.js";

const ORDER = [
  "users", "active_users", "verified_users", "universities", "departments",
  "buildings", "facilities", "events", "study_groups", "posts", "connections",
  "operators",
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/stats").then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="msg err">{error}</div>;
  if (!data) return <div className="empty">Loading…</div>;

  const { totals, signups } = data;
  const peak = Math.max(1, ...signups.map((s) => Number(s.n)));

  return (
    <>
      <h1>Overview</h1>

      <div className="tiles mt">
        {ORDER.filter((k) => totals[k] !== undefined).map((k) => (
          <div className="tile" key={k}>
            <div className="n">{Number(totals[k]).toLocaleString()}</div>
            <div className="k">{humanize(k)}</div>
          </div>
        ))}
      </div>

      <div className="card mt">
        <h2>Signups, last 14 days</h2>
        {signups.length === 0 ? (
          <p className="dim" style={{ marginBottom: 0 }}>
            No signups yet.
          </p>
        ) : (
          <>
            <div className="bars">
              {signups.map((s) => (
                <div
                  className="b"
                  key={s.day}
                  style={{ height: `${(Number(s.n) / peak) * 100}%` }}
                  title={`${new Date(s.day).toLocaleDateString()} — ${s.n}`}
                />
              ))}
            </div>
            <div className="row spread dim" style={{ fontSize: 11, marginTop: 6 }}>
              <span>{new Date(signups[0].day).toLocaleDateString()}</span>
              <span>peak {peak}/day</span>
              <span>
                {new Date(signups[signups.length - 1].day).toLocaleDateString()}
              </span>
            </div>
          </>
        )}
      </div>
    </>
  );
}

import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { Cell, orderColumns, headerClass } from "../columns.jsx";
import { humanize } from "../api.js";

const EXAMPLES = [
  "How many students are there per university?",
  "Which study groups have the most members?",
  "Show the 10 most recent posts with the author's name",
  "Which universities have no students yet?",
  "List upcoming events with how many people said they are going",
  "What are the most common programs across all campuses?",
];

export default function Ask() {
  const { permissions } = useAuth();
  const [info, setInfo] = useState(null);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [rejectedSql, setRejectedSql] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/ai/status").then(setInfo).catch(() => setInfo({ configured: false }));
  }, []);

  const run = async (q) => {
    const text = (q ?? question).trim();
    if (!text) return;
    setQuestion(text);
    setBusy(true);
    setError("");
    setResult(null);
    setRejectedSql("");
    try {
      setResult(await api.post("/ai/sql", { question: text }));
    } catch (e) {
      setError(e.message);
      // The API returns the rejected SQL alongside the error where it has one.
      if (e.sql) setRejectedSql(e.sql);
    } finally {
      setBusy(false);
    }
  };

  if (!permissions?.write) {
    return (
      <>
        <h1>Ask</h1>
        <div className="msg err mt">
          Your role is read-only. Free-form querying reaches every table, so it
          is limited to admins and owners.
        </div>
      </>
    );
  }

  const columns = result?.rows?.length
    ? orderColumns(Object.keys(result.rows[0]), null)
    : [];

  return (
    <>
      <h1>Ask</h1>
      <p className="dim">
        Describe what you want in plain English. It is turned into a read-only
        SQL query, checked, and run against the live database.
      </p>

      {info && !info.configured && (
        <div className="msg err mt">
          <strong>Not configured.</strong> Set <code>GROQ_API_KEY</code> on the
          service and redeploy.
        </div>
      )}

      <form
        className="card mt"
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
      >
        <div className="field" style={{ marginBottom: 10 }}>
          <label htmlFor="q">Question</label>
          <textarea
            id="q"
            rows={2}
            value={question}
            placeholder="How many students are there per university?"
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") run();
            }}
          />
        </div>
        <div className="row spread">
          <span className="dim" style={{ fontSize: 11.5 }}>
            Read-only · max {info?.maxRows ?? 200} rows
            {info?.model && <> · {info.model}</>}
          </span>
          <button className="primary" disabled={busy || !question.trim() || !info?.configured}>
            {busy ? "Thinking…" : "Run"}
          </button>
        </div>
      </form>

      {!result && !error && (
        <div className="card mt">
          <h2>Try one of these</h2>
          <div className="row mt" style={{ gap: 8 }}>
            {EXAMPLES.map((ex) => (
              <button key={ex} className="sm" disabled={busy} onClick={() => run(ex)}>
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="msg err mt">
          {error}
          {rejectedSql && (
            <pre className="sqlbox" style={{ marginTop: 10 }}>{rejectedSql}</pre>
          )}
        </div>
      )}

      {result && (
        <>
          <div className="card mt">
            <div className="row spread">
              <h2>Query</h2>
              <button
                className="sm"
                onClick={() => navigator.clipboard?.writeText(result.sql)}
              >
                Copy
              </button>
            </div>
            <pre className="sqlbox">{result.sql}</pre>
          </div>

          <div className="row spread mt">
            <h2>
              {result.rows.length} row{result.rows.length === 1 ? "" : "s"}
            </h2>
            {result.truncated && <span className="pill">truncated</span>}
          </div>

          {result.rows.length === 0 ? (
            <div className="table-wrap mt">
              <div className="empty">The query ran and returned nothing.</div>
            </div>
          ) : (
            <div className="table-wrap mt">
              <table>
                <thead>
                  <tr>
                    {columns.map((c) => (
                      <th key={c} className={headerClass(c, null)}>{humanize(c)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, i) => (
                    <tr key={i}>
                      {columns.map((c) => (
                        <Cell key={c} name={c} value={row[c]} pk={null} />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}

import { useEffect, useState } from "react";
import { api, formatValue } from "../api.js";
import { useAuth } from "../auth.jsx";

const ROLES = ["owner", "admin", "support"];

const ROLE_HELP = {
  owner: "Full access, and the only role that can manage operator accounts.",
  admin: "Full access to campus data. Cannot manage operators.",
  support: "Read-only.",
};

export default function Operators() {
  const { operator: self } = useAuth();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [adding, setAdding] = useState(false);

  const load = () =>
    api
      .get("/operators")
      .then((d) => setRows(d.operators))
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  const act = async (fn, msg) => {
    setError("");
    setNotice("");
    try {
      await fn();
      setNotice(msg);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  if (error && !rows) return <div className="msg err">{error}</div>;
  if (!rows) return <div className="empty">Loading…</div>;

  return (
    <>
      <div className="row spread">
        <div>
          <h1>Operators</h1>
          <p className="dim" style={{ margin: "2px 0 0" }}>
            Staff accounts for this console. Separate from campus users.
          </p>
        </div>
        <button className="primary" onClick={() => setAdding(true)}>
          New operator
        </button>
      </div>

      {error && <div className="msg err mt">{error}</div>}
      {notice && <div className="msg ok mt">{notice}</div>}

      <div className="table-wrap mt">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last login</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => {
              const isSelf = o.operator_id === self.operator_id;
              return (
                <tr key={o.operator_id}>
                  <td>
                    {o.first_name} {o.last_name}
                    {isSelf && <span className="dim"> (you)</span>}
                  </td>
                  <td>{o.email}</td>
                  <td>
                    <select
                      value={o.role}
                      disabled={isSelf}
                      title={isSelf ? "You cannot change your own role" : ROLE_HELP[o.role]}
                      onChange={(e) =>
                        act(
                          () => api.patch(`/operators/${o.operator_id}`, { role: e.target.value }),
                          `${o.email} is now ${e.target.value}.`
                        )
                      }
                      style={{ width: "auto" }}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className={`pill ${o.is_active ? "on" : "off"}`}>
                      {o.is_active ? "active" : "disabled"}
                    </span>
                  </td>
                  <td className="dim">{formatValue(o.last_login)}</td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      <button
                        className="sm"
                        disabled={isSelf}
                        title={isSelf ? "You cannot deactivate yourself" : ""}
                        onClick={() =>
                          act(
                            () =>
                              api.patch(`/operators/${o.operator_id}`, {
                                is_active: o.is_active ? 0 : 1,
                              }),
                            o.is_active ? "Account disabled." : "Account enabled."
                          )
                        }
                      >
                        {o.is_active ? "Disable" : "Enable"}
                      </button>
                      <button
                        className="sm danger"
                        disabled={isSelf}
                        onClick={() => {
                          if (!confirm(`Delete ${o.email}? This cannot be undone.`)) return;
                          act(
                            () => api.del(`/operators/${o.operator_id}`),
                            "Operator deleted."
                          );
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {adding && (
        <AddOperator
          onCancel={() => setAdding(false)}
          onCreated={(email) => {
            setAdding(false);
            setNotice(`${email} created.`);
            load();
          }}
        />
      )}
    </>
  );
}

function AddOperator({ onCancel, onCreated }) {
  const [form, setForm] = useState({
    email: "", password: "", first_name: "", last_name: "", role: "support",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.post("/operators", form);
      onCreated(form.email);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <form className="modal" onSubmit={submit}>
        <h2>New operator</h2>
        <p className="dim" style={{ fontSize: 12, marginTop: 4 }}>
          They sign in with this email and password. There is no invite email —
          pass the credentials on yourself and have them changed.
        </p>

        {error && <div className="msg err">{error}</div>}

        <div className="field">
          <label htmlFor="op-first">First name *</label>
          <input id="op-first" value={form.first_name} onChange={set("first_name")} required />
        </div>
        <div className="field">
          <label htmlFor="op-last">Last name *</label>
          <input id="op-last" value={form.last_name} onChange={set("last_name")} required />
        </div>
        <div className="field">
          <label htmlFor="op-email">Email *</label>
          <input id="op-email" type="email" value={form.email} onChange={set("email")} required />
        </div>
        <div className="field">
          <label htmlFor="op-pw">Password * (min 10 characters)</label>
          <input
            id="op-pw"
            type="password"
            minLength={10}
            value={form.password}
            onChange={set("password")}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="op-role">Role</label>
          <select id="op-role" value={form.role} onChange={set("role")}>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <p className="dim" style={{ fontSize: 11.5, margin: "4px 0 0" }}>
            {ROLE_HELP[form.role]}
          </p>
        </div>

        <div className="row spread mt">
          <button type="button" onClick={onCancel}>Cancel</button>
          <button className="primary" disabled={busy}>
            {busy ? "Creating…" : "Create operator"}
          </button>
        </div>
      </form>
    </div>
  );
}

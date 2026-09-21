import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api, humanize, formatValue } from "../api.js";
import { useAuth } from "../auth.jsx";

const PAGE = 50;

// Columns the server manages itself; never editable from a form.
const NEVER_EDIT = /_(id)$|^created_at$|^updated_at$|^password_hash$/;

// Fields rendered as a fixed set rather than free text.
const ENUMS = {
  building_type: ["academic","administrative","residential","recreational","dining","library","sports"],
  facility_type: ["classroom","lab","study_room","office","cafe","lounge","library","gym","other"],
};
const BOOLEANS = /^(is_|requires_)/;

export default function Resource() {
  const { resource } = useParams();
  const { permissions } = useAuth();

  const [meta, setMeta] = useState(null);
  const [rows, setRows] = useState(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(null); // row being edited, or {} for new

  // Metadata drives the whole page, so adding a resource server-side needs no
  // change here.
  useEffect(() => {
    api
      .get("/resources")
      .then((d) => setMeta(d.resources.find((r) => r.key === resource) || null))
      .catch((e) => setError(e.message));
  }, [resource]);

  const load = useCallback(async () => {
    setError("");
    try {
      const qs = new URLSearchParams({ limit: PAGE, offset });
      if (query) qs.set("search", query);
      const d = await api.get(`/${resource}?${qs}`);
      setRows(d.rows);
      setTotal(d.total);
    } catch (e) {
      setError(e.message);
      setRows([]);
    }
  }, [resource, offset, query]);

  useEffect(() => {
    setRows(null);
    load();
  }, [load]);

  // Reset paging and filters when switching resource.
  useEffect(() => {
    setOffset(0);
    setSearch("");
    setQuery("");
    setNotice("");
  }, [resource]);

  const columns = useMemo(() => {
    if (!rows?.length) return [];
    return Object.keys(rows[0]);
  }, [rows]);

  const canWrite = permissions?.write;

  const save = async (values) => {
    const isNew = !editing?.__pk;
    if (isNew) {
      await api.post(`/${resource}`, values);
      setNotice(`${meta.label} created.`);
    } else {
      await api.patch(`/${resource}/${editing.__pk}`, values);
      setNotice("Saved.");
    }
    setEditing(null);
    load();
  };

  const destroy = async (pk, label) => {
    // The schema cascades, so ask the server what else this would take with it
    // before showing a confirmation. "Are you sure?" alone badly understates
    // deleting a university, which removes its students too.
    let cascade = [];
    try {
      ({ cascade } = await api.get(`/${resource}/${pk}/impact`));
    } catch {
      /* warning is best-effort; never block the delete on it */
    }

    const consequences = cascade.length
      ? "\n\nThis will ALSO permanently delete:\n" +
        cascade.map((c) => `  \u2022 ${c.count.toLocaleString()} ${c.label}`).join("\n")
      : "";

    if (!confirm(`Delete ${label}?${consequences}\n\nThis cannot be undone.`)) {
      return;
    }

    try {
      await api.del(`/${resource}/${pk}`);
      setNotice(
        cascade.length
          ? `Deleted, along with ${cascade
              .map((c) => `${c.count} ${c.label}`)
              .join(", ")}.`
          : "Deleted."
      );
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  if (!meta && !error) return <div className="empty">Loading…</div>;
  if (!meta) return <div className="msg err">{error || "Unknown resource"}</div>;

  const pkColumn = columns.find((c) => c.endsWith("_id")) || columns[0];

  return (
    <>
      <div className="row spread">
        <div>
          <h1>{meta.label}</h1>
          <p className="dim" style={{ margin: "2px 0 0" }}>
            {total.toLocaleString()} record{total === 1 ? "" : "s"}
            {!meta.canCreate && " · created through the app, managed here"}
          </p>
        </div>
        {meta.canCreate && canWrite && (
          <button className="primary" onClick={() => setEditing({})}>
            New {meta.label.replace(/s$/, "").toLowerCase()}
          </button>
        )}
      </div>

      {error && <div className="msg err mt">{error}</div>}
      {notice && <div className="msg ok mt">{notice}</div>}

      <form
        className="row mt"
        onSubmit={(e) => {
          e.preventDefault();
          setOffset(0);
          setQuery(search);
        }}
      >
        <input
          className="search"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={`Search ${meta.label}`}
        />
        <button>Search</button>
        {query && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setQuery("");
              setOffset(0);
            }}
          >
            Clear
          </button>
        )}
      </form>

      {rows === null ? (
        <div className="empty">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="table-wrap mt">
          <div className="empty">
            {query ? `Nothing matches “${query}”.` : `No ${meta.label.toLowerCase()} yet.`}
          </div>
        </div>
      ) : (
        <div className="table-wrap mt">
          <table>
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c}>{humanize(c)}</th>
                ))}
                {canWrite && <th aria-label="Actions" />}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row[pkColumn]}>
                  {columns.map((c) => (
                    <td key={c} className="clip">
                      {BOOLEANS.test(c) ? (
                        <span className={`pill ${row[c] ? "on" : "off"}`}>
                          {row[c] ? "yes" : "no"}
                        </span>
                      ) : (
                        formatValue(row[c])
                      )}
                    </td>
                  ))}
                  {canWrite && (
                    <td>
                      <div className="row" style={{ gap: 6 }}>
                        {meta.canUpdate && (
                          <button
                            className="sm"
                            onClick={() =>
                              setEditing({ ...row, __pk: row[pkColumn] })
                            }
                          >
                            Edit
                          </button>
                        )}
                        {meta.canDelete && (
                          <button
                            className="sm danger"
                            onClick={() => destroy(row[pkColumn], row[pkColumn])}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > PAGE && (
        <div className="row spread mt">
          <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>
            ← Previous
          </button>
          <span className="dim">
            {offset + 1}–{Math.min(offset + PAGE, total)} of {total.toLocaleString()}
          </span>
          <button disabled={offset + PAGE >= total} onClick={() => setOffset(offset + PAGE)}>
            Next →
          </button>
        </div>
      )}

      {editing && (
        <RecordForm
          meta={meta}
          record={editing}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}
    </>
  );
}

function RecordForm({ meta, record, onCancel, onSave }) {
  const isNew = !record.__pk;
  const fields = meta.columns.filter((c) => !NEVER_EDIT.test(c) || c.endsWith("_id"));

  const [values, setValues] = useState(() =>
    Object.fromEntries(
      meta.columns.map((c) => [c, record[c] ?? (BOOLEANS.test(c) ? 0 : "")])
    )
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      // Only send what the form actually holds; blank optional fields are
      // dropped so we never overwrite a value with an empty string.
      const payload = Object.fromEntries(
        Object.entries(values).filter(
          ([k, v]) => v !== "" || meta.required.includes(k)
        )
      );
      await onSave(payload);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <form className="modal" onSubmit={submit}>
        <h2>
          {isNew ? `New ${meta.label.replace(/s$/, "")}` : `Edit ${record.__pk}`}
        </h2>
        <p className="dim" style={{ fontSize: 12, marginTop: 4 }}>
          {isNew
            ? "The ID is generated automatically."
            : "Only the fields below can be changed."}
        </p>

        {error && <div className="msg err">{error}</div>}

        {fields.map((c) => (
          <div className="field" key={c}>
            <label htmlFor={c}>
              {humanize(c)}
              {meta.required.includes(c) && <span style={{ color: "var(--danger)" }}> *</span>}
            </label>

            {BOOLEANS.test(c) ? (
              <select
                id={c}
                value={values[c] ? "1" : "0"}
                onChange={(e) => setValues({ ...values, [c]: Number(e.target.value) })}
              >
                <option value="1">Yes</option>
                <option value="0">No</option>
              </select>
            ) : ENUMS[c] ? (
              <select
                id={c}
                value={values[c] || ""}
                onChange={(e) => setValues({ ...values, [c]: e.target.value })}
              >
                <option value="">—</option>
                {ENUMS[c].map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            ) : c === "description" ? (
              <textarea
                id={c}
                rows={3}
                value={values[c] || ""}
                onChange={(e) => setValues({ ...values, [c]: e.target.value })}
              />
            ) : (
              <input
                id={c}
                value={values[c] ?? ""}
                required={meta.required.includes(c)}
                onChange={(e) => setValues({ ...values, [c]: e.target.value })}
              />
            )}
          </div>
        ))}

        <div className="row spread mt">
          <button type="button" onClick={onCancel}>Cancel</button>
          <button className="primary" disabled={busy}>
            {busy ? "Saving…" : isNew ? "Create" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

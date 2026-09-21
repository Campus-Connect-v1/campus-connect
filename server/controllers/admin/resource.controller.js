import { db } from "../../config/db.js";
import { getResource, RESOURCES } from "./resources.js";

// Generic CRUD over the whitelist in resources.js. See the note there on why
// interpolating identifiers is safe in this file and nowhere else.

const notFound = (res) =>
  res.status(404).json({ message: "Unknown resource" });

// Sequential ids (uni_1, uni_2, ...) rather than uuids, so they stay readable
// and, for universities, satisfy the /^uni_\d+$/ the signup validator enforces.
const nextId = async (table, pk, prefix) => {
  const [[row]] = await db.execute(
    `SELECT COALESCE(MAX(CAST(SUBSTRING(${pk}, ${prefix.length + 2}) AS UNSIGNED)), 0) AS n
     FROM ${table} WHERE ${pk} REGEXP ?`,
    [`^${prefix}_[0-9]+$`]
  );
  return `${prefix}_${Number(row.n) + 1}`;
};

export const listResourceTypes = (req, res) => {
  res.json({
    resources: Object.entries(RESOURCES).map(([key, r]) => ({
      key,
      label: r.label,
      canCreate: r.create,
      canUpdate: r.update,
      canDelete: r.delete,
      columns: r.columns,
      required: r.required,
    })),
  });
};

export const list = async (req, res) => {
  const r = getResource(req.params.resource);
  if (!r) return notFound(res);

  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const search = (req.query.search || "").trim();

    const where = [];
    const params = [];

    if (search && r.searchable?.length) {
      where.push(
        "(" + r.searchable.map((c) => `${c} LIKE ?`).join(" OR ") + ")"
      );
      // Escape LIKE wildcards so a literal % or _ in the query does not widen it.
      const term = `%${search.replace(/[\\%_]/g, (m) => "\\" + m)}%`;
      r.searchable.forEach(() => params.push(term));
    }

    // Optional exact-match filter on a parent key, e.g. ?university_id=uni_1
    for (const col of r.columns) {
      if (req.query[col] !== undefined && req.query[col] !== "") {
        where.push(`${col} = ?`);
        params.push(req.query[col]);
      }
    }

    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM ${r.table} ${clause}`,
      params
    );
    const [rows] = await db.execute(
      `SELECT ${r.select || "*"} FROM ${r.table} ${clause}
       ORDER BY ${r.sort} LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    res.json({ rows, total, limit, offset });
  } catch (error) {
    console.error(`Admin list ${req.params.resource} failed:`, error);
    res.status(500).json({ message: error.sqlMessage || "Query failed" });
  }
};

export const getOne = async (req, res) => {
  const r = getResource(req.params.resource);
  if (!r) return notFound(res);
  try {
    const [rows] = await db.execute(
      `SELECT ${r.select || "*"} FROM ${r.table} WHERE ${r.pk} = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    res.json({ row: rows[0] });
  } catch (error) {
    console.error(`Admin get ${req.params.resource} failed:`, error);
    res.status(500).json({ message: error.sqlMessage || "Query failed" });
  }
};

export const create = async (req, res) => {
  const r = getResource(req.params.resource);
  if (!r) return notFound(res);
  if (!r.create) {
    return res
      .status(405)
      .json({ message: `${r.label} cannot be created from here` });
  }

  try {
    const missing = r.required.filter(
      (c) => req.body?.[c] === undefined || req.body[c] === ""
    );
    if (missing.length) {
      return res
        .status(400)
        .json({ message: `Missing required: ${missing.join(", ")}` });
    }

    const cols = r.columns.filter((c) => req.body[c] !== undefined);
    const id = await nextId(r.table, r.pk, r.idPrefix);

    await db.execute(
      `INSERT INTO ${r.table} (${r.pk}, ${cols.join(", ")})
       VALUES (${["?", ...cols.map(() => "?")].join(", ")})`,
      [id, ...cols.map((c) => req.body[c])]
    );

    const [rows] = await db.execute(
      `SELECT ${r.select || "*"} FROM ${r.table} WHERE ${r.pk} = ?`,
      [id]
    );
    res.status(201).json({ row: rows[0] });
  } catch (error) {
    console.error(`Admin create ${req.params.resource} failed:`, error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ message: "That already exists (duplicate unique field)" });
    }
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res
        .status(400)
        .json({ message: "Referenced record does not exist" });
    }
    res.status(500).json({ message: error.sqlMessage || "Insert failed" });
  }
};

export const update = async (req, res) => {
  const r = getResource(req.params.resource);
  if (!r) return notFound(res);
  if (!r.update) {
    return res.status(405).json({ message: `${r.label} cannot be edited` });
  }

  try {
    const cols = r.columns.filter((c) => req.body?.[c] !== undefined);
    if (!cols.length) {
      return res.status(400).json({ message: "No editable fields supplied" });
    }

    const [result] = await db.execute(
      `UPDATE ${r.table} SET ${cols.map((c) => `${c} = ?`).join(", ")}
       WHERE ${r.pk} = ?`,
      [...cols.map((c) => req.body[c]), req.params.id]
    );
    if (!result.affectedRows) {
      return res.status(404).json({ message: "Not found" });
    }

    const [rows] = await db.execute(
      `SELECT ${r.select || "*"} FROM ${r.table} WHERE ${r.pk} = ?`,
      [req.params.id]
    );
    res.json({ row: rows[0] });
  } catch (error) {
    console.error(`Admin update ${req.params.resource} failed:`, error);
    res.status(500).json({ message: error.sqlMessage || "Update failed" });
  }
};

// What would disappear along with this row. The UI calls this before showing a
// delete confirmation, because the schema cascades and a generic "are you
// sure?" badly understates the consequences.
export const impact = async (req, res) => {
  const r = getResource(req.params.resource);
  if (!r) return notFound(res);

  try {
    const counts = [];
    for (const dep of r.cascade || []) {
      const [[row]] = await db.execute(
        `SELECT COUNT(*) AS n FROM ${dep.table} WHERE ${dep.fk} = ?`,
        [req.params.id]
      );
      if (Number(row.n) > 0) counts.push({ label: dep.label, count: Number(row.n) });
    }
    res.json({ cascade: counts });
  } catch (error) {
    console.error(`Admin impact ${req.params.resource} failed:`, error);
    // Never block a delete on this failing; the UI just loses the warning.
    res.json({ cascade: [] });
  }
};

export const remove = async (req, res) => {
  const r = getResource(req.params.resource);
  if (!r) return notFound(res);
  if (!r.delete) {
    return res.status(405).json({ message: `${r.label} cannot be deleted` });
  }

  try {
    const [result] = await db.execute(
      `DELETE FROM ${r.table} WHERE ${r.pk} = ?`,
      [req.params.id]
    );
    if (!result.affectedRows) {
      return res.status(404).json({ message: "Not found" });
    }
    res.json({ deleted: req.params.id });
  } catch (error) {
    console.error(`Admin delete ${req.params.resource} failed:`, error);
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        message:
          "Other records still reference this one. Remove them first.",
      });
    }
    res.status(500).json({ message: error.sqlMessage || "Delete failed" });
  }
};

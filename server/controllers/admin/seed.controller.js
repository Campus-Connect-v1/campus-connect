import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "../../config/db.js";
import { getResource } from "./resources.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_DIR = path.resolve(__dirname, "../../db/seeds");

// Curated data shipped with the repo, so a fresh install can be populated
// without anyone typing 43 universities by hand.
const PACKS = {
  "ghana-universities": {
    file: "ghana-universities.json",
    resource: "universities",
    label: "Ghanaian universities",
    description:
      "Public, technical and private institutions. Every domain was confirmed " +
      "to resolve in DNS. All arrive unapproved for review.",
  },
};

export const listPacks = (req, res) => {
  const packs = Object.entries(PACKS).map(([key, p]) => {
    let count = 0;
    try {
      count = JSON.parse(
        fs.readFileSync(path.join(SEED_DIR, p.file), "utf8")
      ).length;
    } catch {
      /* a missing pack reports 0 rather than failing the page */
    }
    return { key, label: p.label, description: p.description, resource: p.resource, count };
  });
  res.json({ packs });
};

// Shared by pack import and pasted JSON. Inserts row by row so one bad record
// cannot abort the rest, and reports exactly what happened to each.
const importRows = async (resourceKey, rows) => {
  const r = getResource(resourceKey);
  if (!r) throw Object.assign(new Error("Unknown resource"), { status: 400 });
  if (!r.create) {
    throw Object.assign(
      new Error(`${r.label} cannot be created`),
      { status: 405 }
    );
  }

  const result = { inserted: 0, skipped: 0, failed: 0, details: [] };

  for (const [i, raw] of rows.entries()) {
    // Drop underscore-prefixed keys (e.g. _kind) and anything not whitelisted.
    const cols = r.columns.filter((c) => raw[c] !== undefined && raw[c] !== "");
    const missing = r.required.filter((c) => !cols.includes(c));

    if (missing.length) {
      result.failed++;
      result.details.push({
        row: i + 1,
        name: raw.name || raw[r.required[0]] || `row ${i + 1}`,
        status: "failed",
        reason: `missing ${missing.join(", ")}`,
      });
      continue;
    }

    try {
      const [[{ n }]] = await db.execute(
        `SELECT COALESCE(MAX(CAST(SUBSTRING(${r.pk}, ${r.idPrefix.length + 2}) AS UNSIGNED)), 0) AS n
         FROM ${r.table} WHERE ${r.pk} REGEXP ?`,
        [`^${r.idPrefix}_[0-9]+$`]
      );
      const id = `${r.idPrefix}_${Number(n) + 1}`;

      await db.execute(
        `INSERT INTO ${r.table} (${r.pk}, ${cols.join(", ")})
         VALUES (${["?", ...cols.map(() => "?")].join(", ")})`,
        [id, ...cols.map((c) => raw[c])]
      );
      result.inserted++;
      result.details.push({ row: i + 1, name: raw.name || id, status: "inserted", id });
    } catch (error) {
      // A duplicate is the expected case on a re-run, not an error.
      if (error.code === "ER_DUP_ENTRY") {
        result.skipped++;
        result.details.push({
          row: i + 1,
          name: raw.name || `row ${i + 1}`,
          status: "skipped",
          reason: "already exists",
        });
      } else {
        result.failed++;
        result.details.push({
          row: i + 1,
          name: raw.name || `row ${i + 1}`,
          status: "failed",
          reason: error.sqlMessage || error.message,
        });
      }
    }
  }
  return result;
};

export const runPack = async (req, res) => {
  const pack = PACKS[req.params.pack];
  if (!pack) return res.status(404).json({ message: "Unknown seed pack" });

  try {
    const rows = JSON.parse(
      fs.readFileSync(path.join(SEED_DIR, pack.file), "utf8")
    );
    const result = await importRows(pack.resource, rows);
    res.json({ ...result, resource: pack.resource, label: pack.label });
  } catch (error) {
    console.error("Seed pack failed:", error);
    res
      .status(error.status || 500)
      .json({ message: error.message || "Seeding failed" });
  }
};

// Paste-your-own: an array of objects, or {rows: [...]}.
export const importJson = async (req, res) => {
  try {
    const { resource } = req.params;
    const body = req.body;
    const rows = Array.isArray(body) ? body : body?.rows;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res
        .status(400)
        .json({ message: "Expected a non-empty array of records" });
    }
    if (rows.length > 500) {
      return res
        .status(413)
        .json({ message: "Import 500 records at a time or fewer" });
    }

    res.json(await importRows(resource, rows));
  } catch (error) {
    console.error("JSON import failed:", error);
    res
      .status(error.status || 500)
      .json({ message: error.message || "Import failed" });
  }
};

// Approve or unapprove universities in bulk. Accreditation is a human call, so
// seeded rows land unverified and pass through here.
export const setVerified = async (req, res) => {
  try {
    const { ids, is_verified } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No universities selected" });
    }
    if (ids.length > 200) {
      return res.status(413).json({ message: "Approve 200 at a time or fewer" });
    }

    const [result] = await db.execute(
      `UPDATE universities SET is_verified = ?
       WHERE university_id IN (${ids.map(() => "?").join(", ")})`,
      [is_verified ? 1 : 0, ...ids]
    );
    res.json({ updated: result.affectedRows, is_verified: is_verified ? 1 : 0 });
  } catch (error) {
    console.error("Bulk approve failed:", error);
    res.status(500).json({ message: "Could not update approval status" });
  }
};

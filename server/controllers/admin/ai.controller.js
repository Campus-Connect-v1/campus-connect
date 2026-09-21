import { db } from "../../config/db.js";

// Plain-English questions -> SQL, via Groq.
//
// The model is untrusted. Everything it returns is validated here before it
// goes anywhere near the database, and the checks are deliberately
// allow-list-shaped: one statement, starting with SELECT or WITH, no
// statement-terminating semicolon mid-query, no write or DDL verb, no
// credential columns, and a LIMIT is imposed whether or not it asked for one.
//
// A rejected query is shown to the operator rather than silently retried, so a
// bad generation is visible instead of mysterious.

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// Verified against this account's /v1/models listing rather than assumed --
// llama-3.3-70b-versatile is not available on it. Override with GROQ_MODEL.
const DEFAULT_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const MAX_ROWS = 200;

// Verbs that change data or schema. Matched on word boundaries so a column
// called "updated_at" or a university named "Created" cannot trip them.
const FORBIDDEN = [
  "insert", "update", "delete", "drop", "alter", "truncate", "create",
  "replace", "grant", "revoke", "rename", "call", "execute", "prepare",
  "handler", "lock", "unlock", "load", "outfile", "dumpfile", "infile",
  "into", "set",
];

// Never queryable, whatever the question. Hashes are still hashes, but there
// is no reason for this feature to hand them out.
const FORBIDDEN_COLUMNS = ["password_hash", "otp_code"];

let schemaCache = null;

// Real schema, read from the database, so the model writes SQL against what
// actually exists rather than what it assumes.
const getSchema = async () => {
  if (schemaCache) return schemaCache;
  const [rows] = await db.execute(`
    SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    ORDER BY TABLE_NAME, ORDINAL_POSITION
  `);
  const tables = {};
  for (const r of rows) {
    if (FORBIDDEN_COLUMNS.includes(r.COLUMN_NAME)) continue;
    (tables[r.TABLE_NAME] ||= []).push(`${r.COLUMN_NAME} ${r.COLUMN_TYPE}`);
  }
  schemaCache = Object.entries(tables)
    .map(([t, cols]) => `${t}(${cols.join(", ")})`)
    .join("\n");
  return schemaCache;
};

const stripFences = (text) =>
  text
    .replace(/^\s*```(?:sql)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();

// Returns null when acceptable, otherwise the reason to show the operator.
export const rejectReason = (sql) => {
  const trimmed = sql.trim().replace(/;+\s*$/, "");
  if (!trimmed) return "The model returned nothing.";

  // Neutralise comments and string literals FIRST, then run every check
  // against what is left. Doing it in this order means a value like
  // 'Department of Creative Arts' cannot look like a CREATE, and a semicolon
  // inside a comment does not read as a second statement -- while a genuinely
  // stacked `SELECT 1; DROP TABLE x` still does.
  const bare = trimmed
    .replace(/--[^\n]*/g, " ")
    .replace(/#[^\n]*/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .trim()
    .replace(/;+\s*$/, "");

  if (!bare) return "The model returned nothing executable.";
  if (bare.includes(";")) return "Contains more than one statement.";
  if (!/^(select|with)\b/i.test(bare)) {
    return "Only SELECT queries are allowed.";
  }

  for (const word of FORBIDDEN) {
    if (new RegExp(`\\b${word}\\b`, "i").test(bare)) {
      return `Contains a disallowed keyword: ${word.toUpperCase()}.`;
    }
  }
  for (const col of FORBIDDEN_COLUMNS) {
    if (new RegExp(`\\b${col}\\b`, "i").test(bare)) {
      return `Reads a protected column: ${col}.`;
    }
  }
  return null;
};

export const enforceLimit = (sql) => {
  const trimmed = sql.trim().replace(/;+\s*$/, "");
  return /\blimit\s+\d+/i.test(trimmed)
    ? trimmed
    : `${trimmed}\nLIMIT ${MAX_ROWS}`;
};

export const status = (req, res) => {
  res.json({
    configured: Boolean(process.env.GROQ_API_KEY),
    model: DEFAULT_MODEL,
    maxRows: MAX_ROWS,
  });
};

export const ask = async (req, res) => {
  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({
      message:
        "GROQ_API_KEY is not set on this service. Add it in the Render " +
        "dashboard (Environment) and redeploy.",
    });
  }

  const question = (req.body?.question || "").trim();
  if (!question) return res.status(400).json({ message: "Ask a question." });
  if (question.length > 500) {
    return res.status(400).json({ message: "Keep the question under 500 characters." });
  }

  let sql;
  try {
    const schema = await getSchema();
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        temperature: 0,
        max_tokens: 700,
        messages: [
          {
            role: "system",
            content:
              "You write a single read-only MySQL SELECT query answering the " +
              "user's question about this schema.\n\n" +
              `SCHEMA:\n${schema}\n\n` +
              "Rules:\n" +
              "- Output ONLY the SQL. No prose, no explanation, no markdown fences.\n" +
              "- Exactly one statement. SELECT or WITH ... SELECT only.\n" +
              "- Never INSERT, UPDATE, DELETE, or any DDL.\n" +
              "- Never reference password_hash or otp_code.\n" +
              `- Always include a LIMIT, at most ${MAX_ROWS}.\n` +
              "- Prefer readable output: join to names rather than returning raw ids alone.\n" +
              "- This is MySQL/MariaDB. Use its date functions.",
          },
          { role: "user", content: question },
        ],
      }),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(502).json({
        message: `Groq returned ${response.status}: ${
          body.error?.message || "unknown error"
        }`,
      });
    }
    sql = stripFences(body.choices?.[0]?.message?.content || "");
  } catch (error) {
    const timedOut = error.name === "TimeoutError" || error.name === "AbortError";
    return res.status(502).json({
      message: timedOut
        ? "Groq did not respond within 30 seconds."
        : `Could not reach Groq: ${error.message}`,
    });
  }

  const reason = rejectReason(sql);
  if (reason) {
    // Return the SQL anyway: seeing what was rejected is more useful than a
    // bare refusal, and it is never executed.
    return res.status(400).json({ message: `Query rejected — ${reason}`, sql });
  }

  const finalSql = enforceLimit(sql);
  try {
    // db.query, not db.execute: these are generated statements with no bound
    // parameters, and the pool's prepared-statement cache should not fill up
    // with one entry per question asked.
    const [rows, fields] = await db.query(finalSql);
    res.json({
      sql: finalSql,
      columns: (fields || []).map((f) => f.name),
      rows: Array.isArray(rows) ? rows.slice(0, MAX_ROWS) : [],
      truncated: Array.isArray(rows) && rows.length > MAX_ROWS,
    });
  } catch (error) {
    res.status(400).json({
      message: `The query failed: ${error.sqlMessage || error.message}`,
      sql: finalSql,
    });
  }
};

// How a column is rendered in a table.
//
// The generic resource page shows whatever the API returns, so without this
// every value arrived as raw text: timestamps as ISO strings, 0/1 for
// booleans, ids competing for width with names, and long post bodies forcing
// the whole table sideways.

import { humanize } from "./api.js";

const BOOL = /^(is_|requires_|has_)/;
const WHEN = /(_at|_time|_login)$/;
const NUM = /^(floors|capacity|graduation_year|academic_year|max_|.*_count|.*_score)/;
const ID = /_id$/;
const LONG = /^(content|description|bio|address|event_description|search_content)$/;
const URL = /_url$/;

export const columnKind = (name) => {
  if (BOOL.test(name)) return "bool";
  if (WHEN.test(name)) return "when";
  if (URL.test(name)) return "url";
  if (LONG.test(name)) return "text";
  if (NUM.test(name)) return "num";
  if (ID.test(name)) return "id";
  return "plain";
};

// Identity first, then the human-meaningful fields, then flags, then
// timestamps. Timestamps last because they are the widest and least scanned.
const WEIGHT = { id: 0, plain: 1, text: 2, url: 3, num: 4, bool: 5, when: 6 };

export const orderColumns = (columns, pk) => {
  const NAMEY = ["name", "first_name", "last_name", "email", "title", "event_title", "group_name", "building_name", "facility_name", "department_name", "domain"];
  return [...columns].sort((a, b) => {
    if (a === pk) return -1;
    if (b === pk) return 1;
    const an = NAMEY.indexOf(a), bn = NAMEY.indexOf(b);
    if (an !== -1 || bn !== -1) {
      return (an === -1 ? 99 : an) - (bn === -1 ? 99 : bn);
    }
    const d = WEIGHT[columnKind(a)] - WEIGHT[columnKind(b)];
    return d !== 0 ? d : a.localeCompare(b);
  });
};

const shortDate = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const now = new Date();
  const days = Math.round((now - d) / 86400000);
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (days === 0) return `Today ${time}`;
  if (days === 1) return `Yesterday ${time}`;
  if (Math.abs(days) < 7) {
    return d.toLocaleDateString([], { weekday: "short" }) + ` ${time}`;
  }
  return d.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    ...(d.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  });
};

export function Cell({ name, value, pk }) {
  const kind = columnKind(name);
  const empty = value === null || value === undefined || value === "";

  if (empty && kind !== "bool") {
    return <td className={cellClass(kind, name, pk)}><span className="cell-empty">—</span></td>;
  }

  switch (kind) {
    case "bool":
      return (
        <td className="tight">
          <span className={`pill ${value ? "on" : "off"}`}>{value ? "yes" : "no"}</span>
        </td>
      );
    case "when":
      return <td className="when" title={new Date(value).toLocaleString()}>{shortDate(value)}</td>;
    case "num":
      return <td className="num">{Number(value).toLocaleString()}</td>;
    case "url":
      return (
        <td className="tight">
          <a href={value} target="_blank" rel="noreferrer noopener" title={value}>
            {String(value).replace(/^https?:\/\//, "").slice(0, 28)}
            {String(value).length > 35 ? "…" : ""}
          </a>
        </td>
      );
    case "text":
      return <td className="text" title={value}>{value}</td>;
    case "id":
      return (
        <td className={`mono ${name === pk ? "sticky-col" : ""}`} title={value}>
          {value}
        </td>
      );
    default:
      return <td className="tight" title={String(value)}>{value}</td>;
  }
}

const cellClass = (kind, name, pk) => {
  if (kind === "num") return "num";
  if (kind === "when") return "when";
  if (kind === "text") return "text";
  if (kind === "id") return `mono ${name === pk ? "sticky-col" : ""}`;
  return "tight";
};

export const headerClass = (name, pk) =>
  name === pk ? "sticky-col" : columnKind(name) === "num" ? "num" : "";

export const columnLabel = humanize;

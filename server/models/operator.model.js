import { db } from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

// Operators are staff accounts for the admin app in app/. They live in their
// own table rather than in `users` -- see db/init.sql for why.

export const ROLES = ["owner", "admin", "support"];

// What each role may do. Checked in middleware/adminAuth.js.
export const PERMISSIONS = {
  owner: { read: true, write: true, manageOperators: true },
  admin: { read: true, write: true, manageOperators: false },
  support: { read: true, write: false, manageOperators: false },
};

const PUBLIC_COLUMNS = `operator_id, email, first_name, last_name, role,
  is_active, last_login, created_at, updated_at`;

export const findOperatorByEmail = async (email) => {
  const [rows] = await db.execute(
    `SELECT operator_id, email, password_hash, first_name, last_name, role,
            is_active
     FROM operators WHERE email = ?`,
    [email]
  );
  return rows[0];
};

export const findOperatorById = async (operatorId) => {
  const [rows] = await db.execute(
    `SELECT ${PUBLIC_COLUMNS} FROM operators WHERE operator_id = ?`,
    [operatorId]
  );
  return rows[0];
};

export const listOperators = async () => {
  const [rows] = await db.execute(
    `SELECT ${PUBLIC_COLUMNS} FROM operators ORDER BY created_at DESC`
  );
  return rows;
};

export const createOperator = async ({
  email,
  password_hash,
  first_name,
  last_name,
  role = "support",
}) => {
  const operatorId = `op_${uuidv4()}`;
  await db.execute(
    `INSERT INTO operators
       (operator_id, email, password_hash, first_name, last_name, role)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [operatorId, email, password_hash, first_name, last_name, role]
  );
  return findOperatorById(operatorId);
};

export const updateOperator = async (operatorId, fields) => {
  // Whitelisted so a request body can never reach an arbitrary column.
  const allowed = ["first_name", "last_name", "role", "is_active"];
  const sets = [];
  const values = [];

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      sets.push(`${key} = ?`);
      values.push(fields[key]);
    }
  }
  if (sets.length === 0) return findOperatorById(operatorId);

  values.push(operatorId);
  await db.execute(
    `UPDATE operators SET ${sets.join(", ")} WHERE operator_id = ?`,
    values
  );
  return findOperatorById(operatorId);
};

export const deleteOperator = async (operatorId) => {
  const [result] = await db.execute(
    "DELETE FROM operators WHERE operator_id = ?",
    [operatorId]
  );
  return result.affectedRows > 0;
};

export const touchLastLogin = async (operatorId) => {
  await db.execute(
    "UPDATE operators SET last_login = CURRENT_TIMESTAMP WHERE operator_id = ?",
    [operatorId]
  );
};

export const countOperators = async () => {
  const [[row]] = await db.execute("SELECT COUNT(*) AS n FROM operators");
  return row.n;
};

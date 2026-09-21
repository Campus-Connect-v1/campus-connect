import jwt from "jsonwebtoken";
import { findOperatorById, PERMISSIONS } from "../models/operator.model.js";

// Operator tokens are marked with scope: "operator" so a normal user token can
// never satisfy an admin route, even though both are signed with JWT_SECRET.
export const OPERATOR_SCOPE = "operator";

export const requireOperator = async (req, res, next) => {
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not defined in environment variables");
    return res.status(500).json({ message: "Server auth misconfigured" });
  }

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Invalid or expired session" });
  }

  if (decoded.scope !== OPERATOR_SCOPE) {
    return res.status(403).json({ message: "Not an operator token" });
  }

  // Re-read the row on every request so deactivating an operator takes effect
  // immediately rather than whenever their token happens to expire.
  const operator = await findOperatorById(decoded.id);
  if (!operator || !operator.is_active) {
    return res.status(403).json({ message: "Operator account is inactive" });
  }

  req.operator = operator;
  next();
};

// Route guard: requireOperator must run first.
export const requirePermission = (permission) => (req, res, next) => {
  const perms = PERMISSIONS[req.operator?.role];
  if (!perms?.[permission]) {
    return res.status(403).json({
      message: `Your role (${req.operator?.role}) cannot perform this action`,
    });
  }
  next();
};

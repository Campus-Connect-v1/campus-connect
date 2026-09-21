import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  findOperatorByEmail,
  touchLastLogin,
  PERMISSIONS,
} from "../../models/operator.model.js";
import { OPERATOR_SCOPE } from "../../middleware/adminAuth.js";

const SALT_ROUNDS = 12;
export const hashOperatorPassword = (plain) => bcrypt.hash(plain, SALT_ROUNDS);

export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const operator = await findOperatorByEmail(email);

    // Same response whether the email is unknown or the password is wrong, so
    // the endpoint cannot be used to enumerate operator accounts.
    const ok =
      operator && (await bcrypt.compare(password, operator.password_hash));
    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (!operator.is_active) {
      return res.status(403).json({ message: "This account is deactivated" });
    }

    const token = jwt.sign(
      { id: operator.operator_id, role: operator.role, scope: OPERATOR_SCOPE },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    await touchLastLogin(operator.operator_id);

    res.json({
      token,
      operator: {
        operator_id: operator.operator_id,
        email: operator.email,
        first_name: operator.first_name,
        last_name: operator.last_name,
        role: operator.role,
      },
      permissions: PERMISSIONS[operator.role],
    });
  } catch (error) {
    console.error("Operator login error:", error);
    res.status(500).json({ message: "Internal server error during login" });
  }
};

// Lets the UI restore a session on reload without keeping anything server-side.
export const me = async (req, res) => {
  res.json({
    operator: req.operator,
    permissions: PERMISSIONS[req.operator.role],
  });
};

import jwt from "jsonwebtoken";
import { isAccountActive } from "../utils/accountStatus.js";

export const authenticate = async (req, res, next) => {
  // Check if JWT_SECRET is available
  if (!process.env.JWT_SECRET) {
    console.error("Error: JWT_SECRET is not defined in environment variables");
    return res.status(500).json({ message: "Server configuration error" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  // Check if header format is correct: "Bearer <token>"
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res
      .status(401)
      .json({ message: "Token format invalid. Use: Bearer <token>" });
  }

  const token = parts[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    } else if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    } else {
      return res.status(401).json({ message: "Token verification failed" });
    }
  }

  // A valid signature only proves the token was issued, not that the account
  // still exists: a deleted account's token stays valid until it expires.
  try {
    if (!(await isAccountActive(decoded.id))) {
      return res.status(401).json({ message: "Account is no longer active" });
    }
  } catch (err) {
    console.error("Account status check failed:", err.message);
    return res.status(503).json({ message: "Service temporarily unavailable" });
  }

  req.user = decoded;
  next();
};
export default authenticate;

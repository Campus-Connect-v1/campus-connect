import {
  listOperators,
  createOperator,
  updateOperator,
  deleteOperator,
  findOperatorById,
  ROLES,
} from "../../models/operator.model.js";
import { hashOperatorPassword } from "./auth.controller.js";

// Owner-only. Guarded by requirePermission("manageOperators").

export const list = async (req, res) => {
  try {
    res.json({ operators: await listOperators() });
  } catch (error) {
    console.error("List operators failed:", error);
    res.status(500).json({ message: "Could not load operators" });
  }
};

export const create = async (req, res) => {
  try {
    const { email, password, first_name, last_name, role } = req.body || {};
    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({
        message: "email, password, first_name and last_name are required",
      });
    }
    if (password.length < 10) {
      return res
        .status(400)
        .json({ message: "Password must be at least 10 characters" });
    }
    if (role && !ROLES.includes(role)) {
      return res
        .status(400)
        .json({ message: `role must be one of: ${ROLES.join(", ")}` });
    }

    const operator = await createOperator({
      email,
      password_hash: await hashOperatorPassword(password),
      first_name,
      last_name,
      role: role || "support",
    });
    res.status(201).json({ operator });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ message: "An operator with that email already exists" });
    }
    console.error("Create operator failed:", error);
    res.status(500).json({ message: "Could not create operator" });
  }
};

export const update = async (req, res) => {
  try {
    const target = await findOperatorById(req.params.id);
    if (!target) return res.status(404).json({ message: "Not found" });

    // Guard against an owner locking themselves out, which would leave the
    // install with no way to manage operators at all.
    const isSelf = target.operator_id === req.operator.operator_id;
    if (isSelf && req.body.is_active === 0) {
      return res
        .status(400)
        .json({ message: "You cannot deactivate your own account" });
    }
    if (isSelf && req.body.role && req.body.role !== "owner") {
      return res
        .status(400)
        .json({ message: "You cannot demote your own account" });
    }
    if (req.body.role && !ROLES.includes(req.body.role)) {
      return res
        .status(400)
        .json({ message: `role must be one of: ${ROLES.join(", ")}` });
    }

    res.json({ operator: await updateOperator(req.params.id, req.body) });
  } catch (error) {
    console.error("Update operator failed:", error);
    res.status(500).json({ message: "Could not update operator" });
  }
};

export const remove = async (req, res) => {
  try {
    if (req.params.id === req.operator.operator_id) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own account" });
    }
    const ok = await deleteOperator(req.params.id);
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ deleted: req.params.id });
  } catch (error) {
    console.error("Delete operator failed:", error);
    res.status(500).json({ message: "Could not delete operator" });
  }
};

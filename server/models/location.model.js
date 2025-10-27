import { db } from "../config/db.js";
export const findByIds = async (userIds) => {
  const placeholders = userIds.map(() => "?").join(",");
  const query = `SELECT * FROM users WHERE user_id IN (${placeholders})`;

  const [rows] = await db.execute(query, userIds);
  return rows;
};

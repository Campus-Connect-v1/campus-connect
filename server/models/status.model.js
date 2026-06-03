import { v4 as uuidv4 } from "uuid";
import db from "../config/db.js";

export const createStatusModel = async (statusData) => {
  const statusId = `status_${uuidv4()}`;
  const {
    user_id,
    content = null,
    media_url = null,
    media_type = "text",
  } = statusData;

  const query = `
    INSERT INTO statuses (status_id, user_id, content, media_url, media_type, expires_at)
    VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))
  `;

  await db.execute(query, [
    statusId,
    user_id,
    content ?? null,
    media_url ?? null,
    media_type ?? "text",
  ]);

  return {
    status_id: statusId,
    user_id,
    content: content ?? null,
    media_url: media_url ?? null,
    media_type: media_type ?? "text",
    expires_at: null,
  };
};

export const getLatestStatusesModel = async (limit = 30) => {
  const safeLimit = Number.isInteger(parseInt(limit)) ? parseInt(limit) : 30;
  const query = `
    SELECT *
    FROM (
      SELECT
        s.*,
        u.first_name,
        u.last_name,
        u.profile_picture_url,
        ROW_NUMBER() OVER (PARTITION BY s.user_id ORDER BY s.created_at DESC) AS rn
      FROM statuses s
      JOIN users u ON s.user_id = u.user_id
      WHERE s.is_active = 1
        AND s.expires_at > NOW()
    ) ranked
    WHERE rn = 1
    ORDER BY created_at DESC
    LIMIT ${safeLimit}
  `;

  const [rows] = await db.execute(query);
  return rows;
};

export const getUserStatusesModel = async (userId) => {
  const query = `
    SELECT
      s.*,
      u.first_name,
      u.last_name,
      u.profile_picture_url
    FROM statuses s
    JOIN users u ON s.user_id = u.user_id
    WHERE s.user_id = ?
      AND s.is_active = 1
      AND s.expires_at > NOW()
    ORDER BY s.created_at ASC
  `;

  const [rows] = await db.execute(query, [userId]);
  return rows;
};

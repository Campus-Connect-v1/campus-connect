import { db } from "../../config/db.js";

// Dashboard counts. One round trip rather than a query per tile.
export const getStats = async (req, res) => {
  try {
    const [[row]] = await db.execute(`
      SELECT
        (SELECT COUNT(*) FROM users)                              AS users,
        (SELECT COUNT(*) FROM users WHERE is_active = 1)          AS active_users,
        (SELECT COUNT(*) FROM users WHERE is_email_verified = 1)  AS verified_users,
        (SELECT COUNT(*) FROM universities)                       AS universities,
        (SELECT COUNT(*) FROM university_departments)             AS departments,
        (SELECT COUNT(*) FROM campus_buildings)                   AS buildings,
        (SELECT COUNT(*) FROM campus_facilities)                  AS facilities,
        (SELECT COUNT(*) FROM events)                             AS events,
        (SELECT COUNT(*) FROM study_groups)                       AS study_groups,
        (SELECT COUNT(*) FROM posts)                              AS posts,
        (SELECT COUNT(*) FROM connections WHERE status='accepted') AS connections,
        (SELECT COUNT(*) FROM operators)                          AS operators
    `);

    // Signups per day for the last 14 days, for the dashboard chart.
    const [signups] = await db.execute(`
      SELECT DATE(created_at) AS day, COUNT(*) AS n
      FROM users
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
      GROUP BY DATE(created_at)
      ORDER BY day
    `);

    res.json({ totals: row, signups });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ message: "Could not load stats" });
  }
};

// Recent audit activity, newest first.
export const getActivity = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const [rows] = await db.execute(
      `SELECT log_id, user_id, action_type, resource_type, resource_id,
              description, ip_address, created_at
       FROM audit_logs
       ORDER BY created_at DESC, log_id DESC
       LIMIT ${limit}`
    );
    res.json({ activity: rows });
  } catch (error) {
    console.error("Admin activity error:", error);
    res.status(500).json({ message: "Could not load activity" });
  }
};

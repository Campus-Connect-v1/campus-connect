import dotenv from "dotenv";
import mysql from "mysql2/promise";
import { COLORS } from "../helper/logger.js";
dotenv.config();

const isWindows = process.platform === "win32";
const isMac = process.platform === "darwin";

// Default/fallbacks for each OS
const configFallbacks = isWindows
  ? {
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER_2 || "new_user",
      database: process.env.DB_NAME_2 || "mobile_app",
      password: process.env.DB_PASSWORD_2 || "new_password",
      port: Number(process.env.DB_PORT_2) || 3306,
    }
  : isMac
  ? {
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      database: process.env.DB_NAME || "mobile_sql",
      password: process.env.DB_PASSWORD || "root",
      port: Number(process.env.DB_PORT) || 8889,
    }
  : {
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "default_user",
      database: process.env.DB_NAME || "default_db",
      password: process.env.DB_PASSWORD || "default_password",
      port: Number(process.env.DB_PORT) || 3306,
    };

export const db = mysql.createPool({
  ...configFallbacks,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // acquireTimeout: 30000,
  // connectTimeout: 10000,
});

(async () => {
  try {
    const connection = await db.getConnection();
    console.log(
      COLORS[process.env.SUCCESS],
      "Successfully connected to the database"
    );
    connection.release();
  } catch (err) {
    console.error(
      COLORS[process.env.SUCCESS],
      "Database connection failed:",
      err
    );
    process.exit(1);
  }
})();

export default db;

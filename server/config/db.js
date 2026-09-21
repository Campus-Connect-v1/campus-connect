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

// Startup connectivity probe.
//
// This used to process.exit(1) on the first failure, which meant a momentary
// blip at the database -- a restart on the host, a network hiccup, the brief
// window while a sleeping instance wakes -- killed the process outright. The
// pool itself reconnects per query, so the only thing exiting achieved was
// turning a recoverable error into downtime.
//
// Instead, retry with exponential backoff and keep retrying in the background.
// The service stays up and heals by itself once the database answers.
const RETRY_BASE_MS = 1000;
const RETRY_MAX_MS = 30000;

const probeDatabase = async (attempt = 1) => {
  try {
    const connection = await db.getConnection();
    console.log(
      COLORS[process.env.SUCCESS],
      attempt === 1
        ? "Successfully connected to the database"
        : `Successfully connected to the database (after ${attempt} attempts)`
    );
    connection.release();
  } catch (err) {
    // Full backoff doubles to a 30s ceiling rather than growing without bound.
    const delay = Math.min(RETRY_BASE_MS * 2 ** (attempt - 1), RETRY_MAX_MS);
    console.error(
      COLORS[process.env.ERROR],
      `Database connection failed (attempt ${attempt}), retrying in ${
        delay / 1000
      }s:`,
      err.code || err.message
    );
    // unref() so a pending retry never holds the process open on shutdown.
    setTimeout(() => probeDatabase(attempt + 1), delay).unref();
  }
};

probeDatabase();

export default db;

// middleware/observability.js
import { randomUUID } from "crypto";

/**
 * A correlation id per request.
 *
 * NODE_ENV=production strips error.message from responses, which is correct --
 * a stack trace is not the client's business. But nothing logged it either, so
 * a 500 reached the app as {"message":"Failed to create post"} and the only way
 * to learn the cause was to reproduce it locally. That is how a one-line
 * undefined-bind bug cost an afternoon.
 *
 * The id goes out on X-Request-Id and into every log line for that request, so
 * "it failed at 14:32" becomes a grep.
 */
export const requestContext = (req, res, next) => {
  // Honour an upstream id when there is one, so a trace survives a proxy.
  req.id = req.headers["x-request-id"] || randomUUID();
  res.setHeader("X-Request-Id", req.id);
  req.startedAt = Date.now();
  next();
};

/**
 * Terminal error handler.
 *
 * Express only routes here when next(err) is called or a sync throw escapes,
 * which most of this codebase's controllers avoid by catching and responding
 * themselves. It is the net for the ones that do not, and for anything thrown
 * by body parsing before a route is even matched -- a malformed JSON body, or
 * one over the size limit, both of which would otherwise return Express's HTML
 * error page to a client that only ever parses JSON.
 */
export const errorLogger = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;

  console.error(
    JSON.stringify({
      level: status >= 500 ? "error" : "warn",
      request_id: req.id,
      method: req.method,
      path: req.originalUrl,
      user_id: req.user?.id ?? null,
      status,
      duration_ms: req.startedAt ? Date.now() - req.startedAt : null,
      message: err.message,
      // Stack only for genuine faults; a 413 or a bad JSON body is not one.
      stack: status >= 500 ? err.stack : undefined,
    })
  );

  if (res.headersSent) return next(err);

  // Body-parser failures carry their own meaningful statuses.
  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Request body is too large" });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body is not valid JSON" });
  }

  res.status(status).json({
    message: status >= 500 ? "Internal server error" : err.message,
    // The id is safe to expose and is the whole point: a user can quote it.
    request_id: req.id,
  });
};

/**
 * Log a handled failure without changing the response.
 *
 * Controllers here catch their own errors and reply, so they never reach
 * errorLogger. This gives them one line to record what actually happened,
 * which is what production was missing.
 */
export const logHandled = (req, scope, error) => {
  console.error(
    JSON.stringify({
      level: "error",
      request_id: req?.id ?? null,
      scope,
      user_id: req?.user?.id ?? null,
      path: req?.originalUrl ?? null,
      message: error?.message ?? String(error),
    })
  );
};

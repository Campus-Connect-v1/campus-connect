import jwt from "jsonwebtoken";

export const verifySocketToken = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token provided"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // university_id is in the token already and was being discarded. The feed
    // fans out per campus, so the socket needs to know which one it is on.
    socket.user = {
      id: decoded.id,
      email: decoded.email,
      university_id: decoded.university_id ?? null,
    };
    next();
  } catch (err) {
    console.error("❌ Socket auth failed:", err.message);
    next(new Error("Authentication failed"));
  }
};

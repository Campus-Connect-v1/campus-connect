// realtime.js
/**
 * Process-local handle on the Socket.IO server.
 *
 * socket.js owns the io instance, but controllers and models need to push to
 * it. They cannot import socket.js directly: socket.js imports the models, so
 * the cycle would leave one side holding a half-initialised module under ESM.
 * Registering the instance here keeps the dependency one-way --
 * socket.js -> realtime.js <- controllers/models.
 *
 * Contract, and it matches notify(): every function here is best-effort and
 * NEVER throws. Realtime is a layer on top of the HTTP response and the
 * persisted row, both of which are authoritative. A dropped socket frame must
 * never turn a successful like into a 500, so every failure path logs and
 * returns false.
 *
 * Delivery is addressed by room rather than by socket id. `onlineUsers` in
 * socket.js maps one user to one socket, so a second device silently evicts
 * the first; a per-user room accumulates every live socket instead, which is
 * what you want when someone has the app open on a phone and a tablet.
 */

let io = null;

/** Called once from socket.js after the server is constructed. */
export const registerRealtime = (server) => {
  io = server;
};

/** Room names. Centralised so the client and server cannot drift apart. */
export const userRoom = (userId) => `user:${userId}`;
export const postRoom = (postId) => `post:${postId}`;

const emit = (target, event, payload) => {
  // Not an error: the HTTP API is usable before socketServer() has run, and
  // the unit tests import controllers without ever starting a server.
  if (!io) return false;

  try {
    io.to(target).emit(event, payload);
    return true;
  } catch (error) {
    console.error(`realtime: emit ${event} -> ${target} failed:`, error.message);
    return false;
  }
};

/** Push to every socket this user has open, across devices. */
export const emitToUser = (userId, event, payload) =>
  userId ? emit(userRoom(userId), event, payload) : false;

/** Push to everyone currently viewing a post (see `join_post` in socket.js). */
export const emitToPost = (postId, event, payload) =>
  postId ? emit(postRoom(postId), event, payload) : false;

/**
 * Push to everyone viewing a post EXCEPT the actor.
 *
 * The actor already has the result in their HTTP response and has almost
 * certainly applied it optimistically. Echoing it back races that local state
 * and makes counters flicker, so the originating socket is excluded by id.
 */
export const emitToPostExcept = (postId, exceptSocketId, event, payload) => {
  if (!io || !postId) return false;

  try {
    const channel = exceptSocketId
      ? io.except(exceptSocketId).to(postRoom(postId))
      : io.to(postRoom(postId));
    channel.emit(event, payload);
    return true;
  } catch (error) {
    console.error(`realtime: emit ${event} -> post ${postId} failed:`, error.message);
    return false;
  }
};

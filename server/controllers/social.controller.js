// controllers/social.controller.js
import {
  createPostModel,
  getFeedPostsModel,
  getPostByIdModel,
  likePostModel,
  unlikePostModel,
  addCommentModel,
  getPostCommentsModel,
  deletePostModel,
  updatePostModel,
  updateCommentModel,
  deleteCommentModel,
  getPostCountsModel,
  encodeFeedCursor,
  FEED_MODES,
  getUserPostsModel,
  encodeUserPostCursor,
  likeCommentModel,
  unlikeCommentModel,
  getCommentLikeStateModel,
  savePostModel,
  unsavePostModel,
  getSavedPostIdsModel,
  getSavedPostsModel,
} from "../models/social.model.js";
import { isOwnMediaUrl } from "../config/cloudinary.js";
import { notify, notifyMany } from "../models/notification.model.js";
import { getConnectionUserIds } from "../models/user.model.js";
import { db } from "../config/db.js";
import { emitToPostExcept } from "../realtime.js";
import { getFollowingCountModel } from "../models/follow.model.js";
import { logHandled } from "../middleware/observability.js";

/**
 * The socket that issued this request, if any.
 *
 * The client sends its own socket id so its writes are not echoed back to it:
 * it already has the authoritative result in the HTTP response and has usually
 * applied it optimistically, so replaying the frame makes counters flicker.
 * Absent header means "echo to everyone", which is correct for a plain HTTP
 * client with no socket at all.
 */
const originSocket = (req) => req.headers["x-socket-id"] || null;

/**
 * Broadcast a change to everyone viewing the post, carrying fresh totals.
 *
 * Counts are re-read rather than incremented client-side: a client that was
 * backgrounded through a frame would otherwise drift with no way to notice.
 * Fire-and-forget -- the caller has already responded, and a realtime failure
 * must not alter the outcome of the request.
 */
const broadcastPost = (req, postId, event, payload = {}) => {
  void (async () => {
    try {
      const counts = await getPostCountsModel(postId);
      emitToPostExcept(postId, originSocket(req), event, {
        post_id: postId,
        ...counts,
        ...payload,
      });
    } catch (error) {
      console.error(`broadcastPost(${event}) failed:`, error.message);
    }
  })();
};

// Create a new post
export const createPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      content,
      media_url,
      media_type = "text",
      visibility = "connections",
      expires_at,
    } = req.body;

    if (!content && !media_url) {
      return res.status(400).json({
        message: "Either content or media_url is required",
      });
    }

    // media_url was accepted as an arbitrary string, so a post could point at
    // any URL on the internet -- a tracking pixel, or something that changes
    // to content nobody approved after the fact. Only accept media we hold.
    if (media_url && !isOwnMediaUrl(media_url)) {
      return res.status(400).json({
        message:
          "media_url must be a Cloudinary URL from this account. Upload via " +
          "POST /api/upload/signature first.",
      });
    }

    const postData = {
      user_id: userId,
      content,
      media_url,
      media_type,
      visibility,
      expires_at: expires_at || null,
    };

    const post = await createPostModel(postData);

    // Fire-and-forget, same as the like/comment notifications below: a
    // notification failure must never turn a successful post into a 500.
    getConnectionUserIds(userId)
      .then(async (connectionIds) => {
        if (!connectionIds.length) return;
        const name = await actorName(userId);
        notifyMany(connectionIds, {
          actorId: userId,
          type: "new_post",
          resourceType: "post",
          resourceId: post.post_id,
          title: `${name} shared a new post`,
          body: content ? String(content).slice(0, 140) : undefined,
        });
      })
      .catch((error) => console.error("new_post fan-out failed:", error.message));

    res.status(201).json({
      message: "Post created successfully",
      post: {
        post_id: post.post_id,
        content: post.content,
        media_url: post.media_url,
        media_type: post.media_type,
        poll_id: post.poll_id || null,
        visibility: post.visibility,
        expires_at: post.expires_at,
        created_at: post.created_at,
      },
    });
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({
      message: "Failed to create post",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get feed posts (from connections)
export const getFeedPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, cursor = null } = req.query;

    // Cap the page size: limit is caller-supplied and an unbounded one lets a
    // single request ask for the whole table.
    const pageSize = Math.min(Math.max(parseInt(limit) || 20, 1), 50);

    /**
     * Which timeline to serve.
     *
     * An account that follows almost nobody would get an empty or near-empty
     * page from a graph query, which is the worst possible first impression
     * and exactly the moment someone decides whether the app is worth keeping.
     * Below the threshold we fall back to campus-wide discovery so there is
     * always something to read, and the suggestions rail has a chance to turn
     * a reader into a follower.
     *
     * The client can force either mode; ?mode=discovery is how an explore
     * surface asks for the campus rather than the graph.
     */
    const MIN_FOLLOWS_FOR_GRAPH_FEED = 3;
    const requested = String(req.query.mode || "").toLowerCase();

    let mode;
    if (requested === FEED_MODES.DISCOVERY || requested === FEED_MODES.FOLLOWING) {
      mode = requested;
    } else {
      const followingCount = await getFollowingCountModel(userId);
      mode =
        followingCount >= MIN_FOLLOWS_FOR_GRAPH_FEED
          ? FEED_MODES.FOLLOWING
          : FEED_MODES.DISCOVERY;
    }

    const posts = await getFeedPostsModel(userId, pageSize, parseInt(offset), cursor, mode);

    // A short page means the end of the feed; sending no cursor is how the
    // client knows to stop asking rather than looping on an empty response.
    const nextCursor =
      posts.length === pageSize ? encodeFeedCursor(posts[posts.length - 1]) : null;

    res.status(200).json({
      message: "Feed posts retrieved successfully",
      count: posts.length,
      // Surfaced so the client can label the feed honestly -- "From your
      // campus" reads very differently from "From people you follow".
      mode,
      next_cursor: nextCursor,
      has_more: Boolean(nextCursor),
      posts: posts.map((post) => ({
        post_id: post.post_id,
        content: post.content,
        media_url: post.media_url,
        media_type: post.media_type,
        poll_id: post.poll_id || null,
        visibility: post.visibility,
        created_at: post.created_at,
        expires_at: post.expires_at,
        author: {
          user_id: post.user_id,
          first_name: post.first_name,
          last_name: post.last_name,
          profile_picture_url: post.profile_picture_url,
          profile_headline: post.profile_headline,
        },
        stats: {
          like_count: parseInt(post.like_count),
          comment_count: parseInt(post.comment_count),
        },
        user_actions: {
          has_liked: Boolean(post.has_liked),
        },
      })),
    });
  } catch (error) {
    console.error("Get feed posts error:", error);
    res.status(500).json({
      message: "Failed to retrieve feed posts",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get a single post
export const getPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { post_id } = req.params;

    const post = await getPostByIdModel(post_id, userId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    res.status(200).json({
      message: "Post retrieved successfully",
      post: {
        post_id: post.post_id,
        content: post.content,
        media_url: post.media_url,
        media_type: post.media_type,
        poll_id: post.poll_id || null,
        visibility: post.visibility,
        created_at: post.created_at,
        expires_at: post.expires_at,
        author: {
          user_id: post.user_id,
          first_name: post.first_name,
          last_name: post.last_name,
          profile_picture_url: post.profile_picture_url,
          profile_headline: post.profile_headline,
        },
        stats: {
          like_count: parseInt(post.like_count),
          comment_count: parseInt(post.comment_count),
        },
        user_actions: {
          has_liked: Boolean(post.has_liked),
        },
      },
    });
  } catch (error) {
    console.error("Get post error:", error);
    res.status(500).json({
      message: "Failed to retrieve post",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Like a post
// Who should be told about activity on a post. Returns null when the actor is
// the author, so the caller can skip notifying someone about their own action.
const postAuthorToNotify = async (postId, actorId) => {
  try {
    const [[row]] = await db.execute(
      "SELECT user_id FROM posts WHERE post_id = ?",
      [postId]
    );
    return row && row.user_id !== actorId ? row.user_id : null;
  } catch {
    return null;
  }
};

const actorName = async (userId) => {
  try {
    const [[row]] = await db.execute(
      "SELECT first_name, last_name FROM users WHERE user_id = ?",
      [userId]
    );
    return row ? `${row.first_name} ${row.last_name}` : "Someone";
  } catch {
    return "Someone";
  }
};

export const likePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { post_id } = req.params;

    const like = await likePostModel(post_id, userId);

    // After the response is sent, not before: a notification failure must not
    // turn a successful like into a 500. notify() never throws, but the await
    // would still delay the reply for no benefit to the caller.
    const author = await postAuthorToNotify(post_id, userId);
    if (author) {
      notify({
        userId: author,
        actorId: userId,
        type: "post_like",
        resourceType: "post",
        resourceId: post_id,
        // actorName + action opt this into bundling: five likers become one
        // "Ada and 4 others liked your post" rather than five rows.
        actorName: await actorName(userId),
        action: "liked your post",
      });
    }

    broadcastPost(req, post_id, "post:liked", { user_id: userId });

    res.status(201).json({
      message: "Post liked successfully",
      like: {
        like_id: like.like_id,
        post_id: like.post_id,
        user_id: like.user_id,
      },
    });
  } catch (error) {
    console.error("Like post error:", error);

    if (error.message.includes("Post already liked")) {
      return res.status(409).json({
        message: "Post already liked",
      });
    }

    if (
      error.message.includes("Post not found") ||
      error.message.includes("inactive") ||
      error.message.includes("expired")
    ) {
      return res.status(404).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to like post",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
// Unlike a post
export const unlikePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { post_id } = req.params;

    await unlikePostModel(post_id, userId);

    broadcastPost(req, post_id, "post:unliked", { user_id: userId });

    res.status(200).json({
      message: "Post unliked successfully",
    });
  } catch (error) {
    console.error("Unlike post error:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        message: "Like not found",
      });
    }

    res.status(500).json({
      message: "Failed to unlike post",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Add comment to post
export const addComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { post_id } = req.params;
    const { content, parent_comment_id = null } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({
        message: "Comment content is required",
      });
    }

    const commentData = {
      post_id,
      user_id: userId,
      content: content.trim(),
      parent_comment_id,
    };

    const comment = await addCommentModel(commentData);
    const [[commenter]] = await db.execute(
      `SELECT first_name, last_name, profile_picture_url
       FROM users
       WHERE user_id = ?`,
      [userId]
    );

    const commentAuthor = await postAuthorToNotify(post_id, userId);
    if (commentAuthor) {
      notify({
        userId: commentAuthor,
        actorId: userId,
        type: "post_comment",
        resourceType: "post",
        resourceId: post_id,
        actorName: await actorName(userId),
        action: "commented on your post",
        body: String(content || "").slice(0, 140),
      });
    }

    broadcastPost(req, post_id, "comment:added", {
      comment: {
        comment_id: comment.comment_id,
        content: comment.content,
        parent_comment_id: comment.parent_comment_id,
        created_at: comment.created_at,
        author: {
          user_id: userId,
          first_name: commenter?.first_name ?? "",
          last_name: commenter?.last_name ?? null,
          profile_picture_url: commenter?.profile_picture_url ?? null,
        },
      },
    });

    res.status(201).json({
      message: "Comment added successfully",
      comment: {
        comment_id: comment.comment_id,
        content: comment.content,
        parent_comment_id: comment.parent_comment_id,
        created_at: comment.created_at,
        author: {
          user_id: userId,
          first_name: commenter?.first_name ?? "",
          last_name: commenter?.last_name ?? null,
          profile_picture_url: commenter?.profile_picture_url ?? null,
        },
      },
    });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({
      message: "Failed to add comment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get post comments
export const getPostComments = async (req, res) => {
  try {
    const { post_id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const comments = await getPostCommentsModel(
      post_id,
      parseInt(limit),
      parseInt(offset),
      req.user.id
    );

    res.status(200).json({
      message: "Comments retrieved successfully",
      count: comments.length,
      comments: comments.map((comment) => ({
        comment_id: comment.comment_id,
        content: comment.content,
        parent_comment_id: comment.parent_comment_id,
        created_at: comment.created_at,
        // Booleans rather than MySQL's 1/0, so the client can use the value
        // directly instead of every call site remembering to coerce it.
        like_count: Number(comment.like_count ?? 0),
        has_liked: Number(comment.has_liked ?? 0) > 0,
        author: {
          user_id: comment.user_id,
          first_name: comment.first_name,
          last_name: comment.last_name,
          profile_picture_url: comment.profile_picture_url,
        },
      })),
    });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({
      message: "Failed to retrieve comments",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Delete a post
export const deletePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { post_id } = req.params;

    await deletePostModel(post_id, userId);

    broadcastPost(req, post_id, "post:deleted", { user_id: userId });

    res.status(200).json({
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Delete post error:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({
        message: "Post not found or access denied",
      });
    }

    res.status(500).json({
      message: "Failed to delete post",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ---------------------------------------------------------------------------
// Edits and comment removal
// ---------------------------------------------------------------------------

// Matches the column type (posts.content / post_comments.content are TEXT) and
// the limit the compose screens already enforce client-side.
const CONTENT_MAX = 5000;

const readContent = (req, res) => {
  const { content } = req.body;

  if (typeof content !== "string" || content.trim() === "") {
    res.status(400).json({ message: "Content is required" });
    return null;
  }

  const trimmed = content.trim();
  if (trimmed.length > CONTENT_MAX) {
    res.status(400).json({
      message: `Content must be ${CONTENT_MAX} characters or fewer`,
    });
    return null;
  }

  return trimmed;
};

// Edit a post
export const updatePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { post_id } = req.params;

    const content = readContent(req, res);
    if (content === null) return;

    await updatePostModel(post_id, userId, content);

    broadcastPost(req, post_id, "post:updated", { content, user_id: userId });

    res.status(200).json({
      message: "Post updated successfully",
      post: { post_id, content },
    });
  } catch (error) {
    console.error("Update post error:", error);

    if (error.message.includes("not found") || error.message.includes("denied")) {
      return res.status(404).json({ message: "Post not found or access denied" });
    }

    res.status(500).json({
      message: "Failed to update post",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Edit a comment
export const updateComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { post_id, comment_id } = req.params;

    const content = readContent(req, res);
    if (content === null) return;

    await updateCommentModel(comment_id, userId, content);

    broadcastPost(req, post_id, "comment:updated", {
      comment_id,
      content,
      user_id: userId,
    });

    res.status(200).json({
      message: "Comment updated successfully",
      comment: { comment_id, content },
    });
  } catch (error) {
    console.error("Update comment error:", error);

    if (error.message.includes("not found") || error.message.includes("denied")) {
      return res
        .status(404)
        .json({ message: "Comment not found or access denied" });
    }

    res.status(500).json({
      message: "Failed to update comment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Delete a comment (author of the comment, or author of the post)
export const deleteComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { post_id, comment_id } = req.params;

    await deleteCommentModel(comment_id, userId);

    broadcastPost(req, post_id, "comment:deleted", {
      comment_id,
      user_id: userId,
    });

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Delete comment error:", error);

    if (error.message.includes("not found") || error.message.includes("denied")) {
      return res
        .status(404)
        .json({ message: "Comment not found or access denied" });
    }

    res.status(500).json({
      message: "Failed to delete comment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ---------------------------------------------------------------------------
// Comment likes
// ---------------------------------------------------------------------------

export const likeComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { comment_id } = req.params;

    const like = await likeCommentModel(comment_id, userId);
    const state = await getCommentLikeStateModel(comment_id, userId);

    // Room is the post, not the comment: a viewer is subscribed to the post
    // they have open, and every comment on it rides the same subscription.
    emitToPostExcept(like.post_id, originSocket(req), "comment:liked", {
      post_id: like.post_id,
      comment_id,
      like_count: state.like_count,
      user_id: userId,
    });

    if (like.comment_author_id) {
      notify({
        userId: like.comment_author_id,
        actorId: userId,
        type: "post_like",
        resourceType: "post",
        resourceId: like.post_id,
        actorName: await actorName(userId),
        action: "liked your comment",
      });
    }

    res.status(201).json({
      message: "Comment liked successfully",
      like: { comment_id, like_count: state.like_count, has_liked: true },
    });
  } catch (error) {
    console.error("Like comment error:", error);

    if (error.message.includes("already liked")) {
      return res.status(409).json({ message: "Comment already liked" });
    }
    if (error.message.includes("not found")) {
      return res.status(404).json({ message: "Comment not found" });
    }

    res.status(500).json({
      message: "Failed to like comment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const unlikeComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { comment_id } = req.params;

    const result = await unlikeCommentModel(comment_id, userId);
    const state = await getCommentLikeStateModel(comment_id, userId);

    if (result.post_id) {
      emitToPostExcept(result.post_id, originSocket(req), "comment:unliked", {
        post_id: result.post_id,
        comment_id,
        like_count: state.like_count,
        user_id: userId,
      });
    }

    res.status(200).json({
      message: "Comment unliked successfully",
      like: { comment_id, like_count: state.like_count, has_liked: false },
    });
  } catch (error) {
    console.error("Unlike comment error:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({ message: "Like not found" });
    }

    res.status(500).json({
      message: "Failed to unlike comment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ---------------------------------------------------------------------------
// Saved posts
// ---------------------------------------------------------------------------

export const savePost = async (req, res) => {
  try {
    const { post_id } = req.params;
    const saved = await savePostModel(post_id, req.user.id);
    res.status(201).json({ message: "Post saved", saved });
  } catch (error) {
    console.error("Save post error:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(500).json({
      message: "Failed to save post",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const unsavePost = async (req, res) => {
  try {
    const { post_id } = req.params;
    await unsavePostModel(post_id, req.user.id);
    res.status(200).json({ message: "Post unsaved" });
  } catch (error) {
    console.error("Unsave post error:", error);
    res.status(500).json({
      message: "Failed to unsave post",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/** Ids only — for hydrating bookmark state across a feed in one request. */
export const getSavedPostIds = async (req, res) => {
  try {
    const postIds = await getSavedPostIdsModel(req.user.id);
    res.status(200).json({ count: postIds.length, post_ids: postIds });
  } catch (error) {
    console.error("Get saved post ids error:", error);
    res.status(500).json({
      message: "Failed to load saved posts",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const getSavedPosts = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const posts = await getSavedPostsModel(
      req.user.id,
      parseInt(limit, 10) || 50,
      parseInt(offset, 10) || 0
    );
    res.status(200).json({ count: posts.length, posts });
  } catch (error) {
    console.error("Get saved posts error:", error);
    res.status(500).json({
      message: "Failed to load saved posts",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * A single user's posts, for their profile.
 *
 * Exists because the client was reconstructing this by filtering its own feed,
 * which stopped working the moment the feed became graph-scoped: a profile for
 * someone you do not follow contained none of their posts, because none of
 * them were in your feed to filter.
 */
export const getUserPosts = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { limit = 20, cursor = null } = req.query;

    const pageSize = Math.min(Math.max(parseInt(limit) || 20, 1), 50);
    const posts = await getUserPostsModel(user_id, req.user.id, pageSize, cursor);

    const nextCursor =
      posts.length === pageSize ? encodeUserPostCursor(posts[posts.length - 1]) : null;

    res.status(200).json({
      count: posts.length,
      next_cursor: nextCursor,
      has_more: Boolean(nextCursor),
      posts,
    });
  } catch (error) {
    logHandled(req, "getUserPosts", error);
    res.status(500).json({ message: "Failed to load posts" });
  }
};

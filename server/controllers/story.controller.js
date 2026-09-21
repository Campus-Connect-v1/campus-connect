// controllers/story.controller.js
import {
  createStoryModel,
  getStoryFeedModel,
  getUserStoriesModel,
  getStoryByIdModel,
  getStoryOwnerModel,
  getRepostablePostModel,
  recordStoryViewModel,
  getStoryViewersModel,
  deleteStoryModel,
} from "../models/story.model.js";
import { isOwnMediaUrl } from "../config/cloudinary.js";

const STORY_TYPES = ["image", "video", "text", "repost"];
const VISIBILITIES = ["public", "connections", "university"];

// #rgb or #rrggbb
const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

// A story lives for a day by default. The ceiling is a week: the tray and its
// index are sized for a short window, and an unbounded duration would turn
// stories into permanent posts by another name.
const DEFAULT_DURATION_HOURS = 24;
const MIN_DURATION_HOURS = 1;
const MAX_DURATION_HOURS = 168;

// Shape a story row for the client. The repost_* columns arrive flat from the
// JOIN and are folded back into a nested object here.
const serializeStory = (story) => ({
  story_id: story.story_id,
  story_type: story.story_type,
  media_url: story.media_url,
  content: story.content,
  background_color: story.background_color,
  visibility: story.visibility,
  created_at: story.created_at,
  expires_at: story.expires_at,
  has_viewed: Boolean(story.has_viewed),
  reposted_post: story.repost_post_id
    ? {
        post_id: story.repost_post_id,
        content: story.repost_content,
        media_url: story.repost_media_url,
        media_type: story.repost_media_type,
        author: {
          user_id: story.repost_author_id,
          first_name: story.repost_author_first_name,
          last_name: story.repost_author_last_name,
          profile_picture_url: story.repost_author_picture,
        },
      }
    : null,
});

// Create a story
export const createStory = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      story_type = "image",
      media_url = null,
      content = null,
      background_color = null,
      repost_post_id = null,
      visibility = "connections",
      duration_hours,
    } = req.body;

    if (!STORY_TYPES.includes(story_type)) {
      return res.status(400).json({
        message: `story_type must be one of: ${STORY_TYPES.join(", ")}`,
      });
    }

    if (!VISIBILITIES.includes(visibility)) {
      return res.status(400).json({
        message: `visibility must be one of: ${VISIBILITIES.join(", ")}`,
      });
    }

    // media_url is an arbitrary string on the wire, so a story could point at
    // any URL on the internet -- a tracking pixel, or something that changes
    // to content nobody approved after the fact. Only accept media we hold.
    if (media_url && !isOwnMediaUrl(media_url)) {
      return res.status(400).json({
        message:
          "media_url must be a Cloudinary URL from this account. Upload via " +
          "POST /api/upload/signature first.",
      });
    }

    let repostedPost = null;

    if (story_type === "image" || story_type === "video") {
      if (!media_url) {
        return res.status(400).json({
          message: `media_url is required for a ${story_type} story`,
        });
      }
    } else if (story_type === "text") {
      if (!content || content.trim() === "") {
        return res.status(400).json({
          message: "content is required for a text story",
        });
      }
      if (media_url) {
        return res.status(400).json({
          message: "media_url is not allowed on a text story",
        });
      }
      if (background_color && !HEX_COLOR.test(background_color)) {
        return res.status(400).json({
          message: "background_color must be a hex colour, e.g. #fff or #1a2b3c",
        });
      }
    } else {
      if (!repost_post_id) {
        return res.status(400).json({
          message: "repost_post_id is required for a repost story",
        });
      }

      repostedPost = await getRepostablePostModel(repost_post_id, userId);

      if (!repostedPost) {
        return res.status(404).json({ message: "Post not found" });
      }
      // Reposting is a read of the post, so it needs the same permission a
      // direct read would -- otherwise a story becomes a way to republish
      // something private to a wider audience.
      if (!repostedPost.can_view) {
        return res.status(403).json({
          message: "You do not have access to this post",
        });
      }
    }

    const requestedDuration =
      duration_hours === undefined || duration_hours === null
        ? DEFAULT_DURATION_HOURS
        : parseInt(duration_hours, 10);

    if (Number.isNaN(requestedDuration)) {
      return res.status(400).json({
        message: "duration_hours must be a number",
      });
    }

    const durationHours = Math.min(
      Math.max(requestedDuration, MIN_DURATION_HOURS),
      MAX_DURATION_HOURS
    );

    const story = await createStoryModel({
      user_id: userId,
      story_type,
      media_url: story_type === "text" ? null : media_url,
      content: content ? content.trim() : null,
      background_color: story_type === "text" ? background_color : null,
      repost_post_id: story_type === "repost" ? repost_post_id : null,
      visibility,
      duration_hours: durationHours,
    });

    res.status(201).json({
      message: "Story created successfully",
      story: serializeStory(story),
    });
  } catch (error) {
    console.error("Create story error:", error);
    res.status(500).json({
      message: "Failed to create story",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get the story tray: active stories grouped by author
export const getStoryFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    const groups = await getStoryFeedModel(
      userId,
      parseInt(limit, 10),
      parseInt(offset, 10)
    );

    res.status(200).json({
      message: "Story feed retrieved successfully",
      count: groups.length,
      groups: groups.map((group) => ({
        author: {
          user_id: group.user_id,
          first_name: group.first_name,
          last_name: group.last_name,
          profile_picture_url: group.profile_picture_url,
        },
        story_count: parseInt(group.story_count, 10),
        unseen_count: parseInt(group.unseen_count, 10),
        all_viewed: parseInt(group.unseen_count, 10) === 0,
        is_own: group.user_id === userId,
        latest_story_at: group.latest_story_at,
        stories: group.stories.map(serializeStory),
      })),
    });
  } catch (error) {
    console.error("Get story feed error:", error);
    res.status(500).json({
      message: "Failed to retrieve story feed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get one author's active stories
export const getUserStories = async (req, res) => {
  try {
    const userId = req.user.id;
    const { user_id } = req.params;

    const stories = await getUserStoriesModel(user_id, userId);

    res.status(200).json({
      message: "Stories retrieved successfully",
      count: stories.length,
      author: stories.length
        ? {
            user_id,
            first_name: stories[0].first_name,
            last_name: stories[0].last_name,
            profile_picture_url: stories[0].profile_picture_url,
          }
        : null,
      stories: stories.map(serializeStory),
    });
  } catch (error) {
    console.error("Get user stories error:", error);
    res.status(500).json({
      message: "Failed to retrieve stories",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get a single story
export const getStory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { story_id } = req.params;

    const story = await getStoryByIdModel(story_id, userId);

    // No row means gone (deleted or expired); a row the viewer fails the
    // visibility check on means forbidden. Collapsing the two would tell a
    // stranger nothing, but it would also hide real 404s from the client.
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    if (!story.can_view) {
      return res.status(403).json({
        message: "You do not have access to this story",
      });
    }

    const isAuthor = story.user_id === userId;

    res.status(200).json({
      message: "Story retrieved successfully",
      story: {
        ...serializeStory(story),
        author: {
          user_id: story.user_id,
          first_name: story.first_name,
          last_name: story.last_name,
          profile_picture_url: story.profile_picture_url,
        },
        // View counts are the author's own metric, not public information.
        ...(isAuthor ? { view_count: parseInt(story.view_count, 10) } : {}),
      },
    });
  } catch (error) {
    console.error("Get story error:", error);
    res.status(500).json({
      message: "Failed to retrieve story",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Record a view
export const viewStory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { story_id } = req.params;

    const story = await getStoryByIdModel(story_id, userId);

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    if (!story.can_view) {
      return res.status(403).json({
        message: "You do not have access to this story",
      });
    }

    // Authors would otherwise inflate their own viewer list every time they
    // opened their tray.
    if (story.user_id === userId) {
      return res.status(200).json({
        message: "Own story view not recorded",
        recorded: false,
      });
    }

    const view = await recordStoryViewModel(story_id, userId);

    res.status(200).json({
      message: view.new ? "Story view recorded" : "Story already viewed",
      recorded: true,
      already_viewed: !view.new,
    });
  } catch (error) {
    console.error("View story error:", error);
    res.status(500).json({
      message: "Failed to record story view",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// List who viewed a story (author only)
export const getStoryViewers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { story_id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const story = await getStoryOwnerModel(story_id);

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    if (story.user_id !== userId) {
      return res.status(403).json({
        message: "Only the author can see who viewed this story",
      });
    }

    const viewers = await getStoryViewersModel(
      story_id,
      parseInt(limit, 10),
      parseInt(offset, 10)
    );

    res.status(200).json({
      message: "Story viewers retrieved successfully",
      count: viewers.length,
      viewers: viewers.map((viewer) => ({
        viewed_at: viewer.viewed_at,
        user_id: viewer.user_id,
        first_name: viewer.first_name,
        last_name: viewer.last_name,
        profile_picture_url: viewer.profile_picture_url,
      })),
    });
  } catch (error) {
    console.error("Get story viewers error:", error);
    res.status(500).json({
      message: "Failed to retrieve story viewers",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Delete a story (author only)
export const deleteStory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { story_id } = req.params;

    const story = await getStoryOwnerModel(story_id);

    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    if (story.user_id !== userId) {
      return res.status(403).json({
        message: "Only the author can delete this story",
      });
    }

    await deleteStoryModel(story_id, userId);

    res.status(200).json({ message: "Story deleted successfully" });
  } catch (error) {
    console.error("Delete story error:", error);
    res.status(500).json({
      message: "Failed to delete story",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

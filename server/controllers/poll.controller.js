// controllers/poll.controller.js
import {
  createPollModel,
  getPollByIdModel,
  getPollResultsModel,
  votePollModel,
  retractVoteModel,
  deletePollModel,
} from "../models/poll.model.js";

// Mirrors the posts.visibility enum; a value outside it fails at insert time
// with a 500 that tells the client nothing.
const VISIBILITY_OPTIONS = ["public", "connections", "university"];

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

// Model errors arrive wrapped in "Database error in fn: ", which is internal
// noise to an API client.
const clientMessage = (error) =>
  error.message.replace(/^Database error in \w+: /, "");

const serializePoll = (poll) => ({
  poll_id: poll.poll_id,
  post_id: poll.post_id,
  question: poll.question,
  max_selections: poll.max_selections,
  closes_at: poll.closes_at,
  allow_change: Boolean(poll.allow_change),
  is_closed: poll.is_closed,
  visibility: poll.visibility,
  created_at: poll.created_at,
  author: {
    user_id: poll.user_id,
    first_name: poll.first_name,
    last_name: poll.last_name,
    profile_picture_url: poll.profile_picture_url,
  },
  options: poll.options.map((option) => ({
    option_id: option.option_id,
    option_text: option.option_text,
    position: option.position,
    vote_count: option.vote_count,
  })),
  total_voters: poll.total_voters,
  user_actions: {
    has_voted: poll.user_selections.length > 0,
    selected_option_ids: poll.user_selections,
  },
});

// Create a poll
export const createPoll = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      question,
      options,
      max_selections = 1,
      closes_at = null,
      allow_change = true,
      visibility = "connections",
    } = req.body;

    if (typeof question !== "string" || question.trim() === "") {
      return res.status(400).json({
        message: "question is required",
      });
    }

    if (question.trim().length > 500) {
      return res.status(400).json({
        message: "question cannot exceed 500 characters",
      });
    }

    if (
      !Array.isArray(options) ||
      options.length < MIN_OPTIONS ||
      options.length > MAX_OPTIONS
    ) {
      return res.status(400).json({
        message: `options must be an array of ${MIN_OPTIONS} to ${MAX_OPTIONS} choices`,
      });
    }

    const optionTexts = options.map((option) =>
      typeof option === "string" ? option.trim() : ""
    );

    if (optionTexts.some((option) => option === "")) {
      return res.status(400).json({
        message: "Every option must be a non-empty string",
      });
    }

    if (optionTexts.some((option) => option.length > 255)) {
      return res.status(400).json({
        message: "An option cannot exceed 255 characters",
      });
    }

    // Compared case-insensitively: two options that read identically to a
    // voter split the vote and make the result meaningless, whatever the bytes.
    const distinct = new Set(optionTexts.map((option) => option.toLowerCase()));
    if (distinct.size !== optionTexts.length) {
      return res.status(400).json({
        message: "Options must be unique",
      });
    }

    const maxSelections = parseInt(max_selections, 10);
    if (
      !Number.isInteger(maxSelections) ||
      maxSelections < 1 ||
      maxSelections > optionTexts.length
    ) {
      return res.status(400).json({
        message: `max_selections must be between 1 and ${optionTexts.length}`,
      });
    }

    if (!VISIBILITY_OPTIONS.includes(visibility)) {
      return res.status(400).json({
        message: `visibility must be one of: ${VISIBILITY_OPTIONS.join(", ")}`,
      });
    }

    let closesAt = null;
    if (closes_at) {
      closesAt = new Date(closes_at);

      if (Number.isNaN(closesAt.getTime())) {
        return res.status(400).json({
          message: "closes_at must be a valid date",
        });
      }

      if (closesAt.getTime() <= Date.now()) {
        return res.status(400).json({
          message: "closes_at must be in the future",
        });
      }
    }

    const { poll_id } = await createPollModel({
      user_id: userId,
      question: question.trim(),
      options: optionTexts,
      max_selections: maxSelections,
      closes_at: closesAt,
      allow_change: allow_change ? 1 : 0,
      visibility,
    });

    const poll = await getPollByIdModel(poll_id, userId);

    res.status(201).json({
      message: "Poll created successfully",
      poll: serializePoll(poll),
    });
  } catch (error) {
    console.error("Create poll error:", error);
    res.status(500).json({
      message: "Failed to create poll",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get a single poll
export const getPoll = async (req, res) => {
  try {
    const userId = req.user.id;
    const { poll_id } = req.params;

    const poll = await getPollByIdModel(poll_id, userId);

    if (!poll) {
      return res.status(404).json({
        message: "Poll not found",
      });
    }

    res.status(200).json({
      message: "Poll retrieved successfully",
      poll: serializePoll(poll),
    });
  } catch (error) {
    console.error("Get poll error:", error);
    res.status(500).json({
      message: "Failed to retrieve poll",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get poll results
export const getPollResults = async (req, res) => {
  try {
    const { poll_id } = req.params;

    const results = await getPollResultsModel(poll_id);

    if (!results) {
      return res.status(404).json({
        message: "Poll not found",
      });
    }

    res.status(200).json({
      message: "Poll results retrieved successfully",
      results: {
        poll_id: results.poll_id,
        question: results.question,
        max_selections: results.max_selections,
        closes_at: results.closes_at,
        is_closed: results.is_closed,
        total_voters: results.total_voters,
        options: results.options.map((option) => ({
          option_id: option.option_id,
          option_text: option.option_text,
          position: option.position,
          vote_count: option.vote_count,
          percentage: option.percentage,
        })),
      },
    });
  } catch (error) {
    console.error("Get poll results error:", error);
    res.status(500).json({
      message: "Failed to retrieve poll results",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Cast or change a vote
export const votePoll = async (req, res) => {
  try {
    const userId = req.user.id;
    const { poll_id } = req.params;
    const { option_ids } = req.body;

    if (!Array.isArray(option_ids) || option_ids.length === 0) {
      return res.status(400).json({
        message: "option_ids must be a non-empty array",
      });
    }

    if (option_ids.some((id) => typeof id !== "string" || id.trim() === "")) {
      return res.status(400).json({
        message: "Every option_id must be a non-empty string",
      });
    }

    // Collapse repeats before the max_selections cap is applied, so sending
    // the same option twice counts as one choice instead of tripping the
    // UNIQUE on (option_id, user_id).
    const optionIds = [...new Set(option_ids.map((id) => id.trim()))];

    const vote = await votePollModel(poll_id, userId, optionIds);

    res.status(201).json({
      message: vote.changed
        ? "Vote updated successfully"
        : "Vote recorded successfully",
      vote: {
        poll_id: vote.poll_id,
        option_ids: vote.option_ids,
      },
    });
  } catch (error) {
    console.error("Vote poll error:", error);

    if (error.message.includes("Poll not found")) {
      return res.status(404).json({
        message: "Poll not found",
      });
    }

    if (error.message.includes("Poll is closed")) {
      return res.status(409).json({
        message: "Poll is closed and no longer accepts votes",
      });
    }

    if (error.message.includes("Vote already recorded")) {
      return res.status(409).json({
        message: "You have already voted and this poll does not allow changes",
      });
    }

    if (error.message.includes("Duplicate vote")) {
      return res.status(409).json({
        message: "That option is already selected",
      });
    }

    if (
      error.message.includes("Too many selections") ||
      error.message.includes("Invalid option")
    ) {
      return res.status(400).json({
        message: clientMessage(error),
      });
    }

    res.status(500).json({
      message: "Failed to record vote",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Retract a vote
export const retractVote = async (req, res) => {
  try {
    const userId = req.user.id;
    const { poll_id } = req.params;

    await retractVoteModel(poll_id, userId);

    res.status(200).json({
      message: "Vote retracted successfully",
    });
  } catch (error) {
    console.error("Retract vote error:", error);

    if (error.message.includes("Poll not found")) {
      return res.status(404).json({
        message: "Poll not found",
      });
    }

    if (error.message.includes("Poll is closed")) {
      return res.status(409).json({
        message: "Poll is closed and votes can no longer be retracted",
      });
    }

    if (error.message.includes("No vote to retract")) {
      return res.status(404).json({
        message: "No vote to retract",
      });
    }

    res.status(500).json({
      message: "Failed to retract vote",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Delete a poll
export const deletePoll = async (req, res) => {
  try {
    const userId = req.user.id;
    const { poll_id } = req.params;

    await deletePollModel(poll_id, userId);

    res.status(200).json({
      message: "Poll deleted successfully",
    });
  } catch (error) {
    console.error("Delete poll error:", error);

    if (error.message.includes("Poll not found")) {
      return res.status(404).json({
        message: "Poll not found",
      });
    }

    if (error.message.includes("Access denied")) {
      return res.status(403).json({
        message: "Only the poll author can delete this poll",
      });
    }

    res.status(500).json({
      message: "Failed to delete poll",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

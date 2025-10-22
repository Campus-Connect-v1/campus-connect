import {
  getUserProfile,
  updateUserProfileModel,
  searchUsersModel,
  createConnectionRequest,
  updateConnectionStatus,
  getUserConnections,
  addCourseModel,
  addInterestModel,
  removeInterestModel,
  removeCourseModel,
  getUserStatsModel,
  checkCourseExistsModel,
  getConnectionRecommendationsModel,
  removeCourseByCodeModel,
  findById,
  checkExistingConnectionModel,
  getAllUserConnectionsModel,
  updateInterestModel,
  cancelConnectionRequestModel,
} from "../models/user.model.js";
import { authenticate } from "../middleware/auth.js";

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await getUserProfile(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile retrieved successfully",
      user: {
        id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        profile_picture_url: user.profile_picture_url,
        phone_number: user.phone_number,
        program: user.program,
        bio: user.bio,
        date_of_birth: user.date_of_birth,
        gender: user.gender,
        year_of_study: user.year_of_study,
        graduation_year: user.graduation_year,
        interests: user.interests ? JSON.parse(user.interests) : [],
        social_links: user.social_links ? JSON.parse(user.social_links) : {},
        privacy_settings: user.privacy_settings
          ? JSON.parse(user.privacy_settings)
          : {},
        is_profile_complete: user.is_profile_complete,
        university_id: user.university_id,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    // Parse JSON fields if they're strings
    if (updateData.interests && typeof updateData.interests === "string") {
      updateData.interests = JSON.parse(updateData.interests);
    }
    if (
      updateData.social_links &&
      typeof updateData.social_links === "string"
    ) {
      updateData.social_links = JSON.parse(updateData.social_links);
    }
    if (
      updateData.privacy_settings &&
      typeof updateData.privacy_settings === "string"
    ) {
      updateData.privacy_settings = JSON.parse(updateData.privacy_settings);
    }

    const updated = await updateUserProfileModel(userId, updateData);

    if (!updated) {
      return res
        .status(404)
        .json({ message: "User not found or no changes made" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      updated: true,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const deleteProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { deletion_reason, password } = req.body;

    // Optional: Add password confirmation for security
    if (password) {
      const user = await getUserByIdModel(userId);
      const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash
      );

      if (!isPasswordValid) {
        return res.status(401).json({
          message:
            "Invalid password. Please confirm your password to delete your account.",
        });
      }
    }

    // Perform the soft delete
    const result = await deleteProfileModel(
      userId,
      deletion_reason || "User requested account deletion"
    );

    if (result.archived && result.deactivated) {
      // Logout the user by clearing their session/token
      res.clearCookie("token"); // If using cookies

      res.status(200).json({
        message: "Account successfully deleted",
        details:
          "Your profile has been deactivated and all personal data has been archived. You can recover your account within 30 days by contacting support.",
        deletion_timestamp: new Date().toISOString(),
      });
    } else {
      throw new Error("Failed to delete profile");
    }
  } catch (error) {
    console.error("Delete profile error:", error);

    if (error.message.includes("User not found")) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(500).json({
      message: "Failed to delete profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
// Search users
export const searchUsers = async (req, res) => {
  try {
    const criteria = req.query;
    const users = await searchUsersModel(criteria);
    if (users.length === 0) {
      return res.status(200).json({
        message: `No users found based on the criteria provided -- ${JSON.stringify(
          criteria
        )}`,
      });
    }
    res.status(200).json({
      message: "Users retrieved successfully",
      count: users.length,
      users: users.map((user) => ({
        id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        profile_picture_url: user.profile_picture_url,
        program: user.program,
        year_of_study: user.year_of_study,
        university_id: user.university_id,
        bio: user.bio,
      })),
    });
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Send connection request
export const sendConnectionRequest = async (req, res) => {
  try {
    const requesterId = req.user.id;
    const { receiver_id, connection_note, shared_courses } = req.body;

    if (!receiver_id) {
      return res.status(400).json({ message: "Receiver ID is required" });
    }

    if (requesterId === receiver_id) {
      return res.status(400).json({
        message: "Cannot send connection request to yourself",
      });
    }

    // Check existing connection with detailed status
    const existingConnection = await checkExistingConnectionModel(
      requesterId,
      receiver_id
    );

    if (existingConnection) {
      let message;
      switch (existingConnection.status) {
        case "pending":
          if (existingConnection.requester_id === requesterId) {
            message = "You have already sent a connection request to this user";
          } else {
            message = "This user has already sent you a connection request";
          }
          break;
        case "accepted":
          message = "You are already connected with this user";
          break;
        case "declined":
          message = "Previous connection request was declined";
          break;
        case "blocked":
          message = "Cannot send connection request - connection is blocked";
          break;
        default:
          message = "Connection already exists";
      }

      return res.status(409).json({
        message,
        connection_id: existingConnection.connection_id,
        status: existingConnection.status,
        your_role:
          existingConnection.requester_id === requesterId
            ? "requester"
            : "receiver",
      });
    }

    // Generate unique connection ID
    const connectionId = `conn_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Create new connection
    await createConnectionRequest(
      connectionId,
      requesterId,
      receiver_id,
      connection_note,
      shared_courses
    );

    res.status(201).json({
      message: "Connection request sent successfully",
      connection_id: connectionId,
    });
  } catch (error) {
    console.error("Send connection error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Connection request already exists",
      });
    }

    res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
export const cancelConnectionRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { connection_id } = req.params;

    if (!connection_id) {
      return res.status(400).json({
        message: "Connection ID is required",
      });
    }

    const result = await cancelConnectionRequestModel(connection_id, userId);

    let message = "Connection request cancelled successfully";
    if (result.previous_status && result.previous_status !== "pending") {
      message = "Connection removed successfully";
    }

    res.status(200).json({
      message,
      connection_id: result.connection_id,
      status: result.new_status,
      previous_status: result.previous_status,
    });
  } catch (error) {
    console.error("Cancel connection request error:", error);

    if (
      error.message.includes("not found") ||
      error.message.includes("don't have permission")
    ) {
      return res.status(404).json({
        message: error.message,
      });
    }

    if (error.message.includes("Only the person who sent")) {
      return res.status(403).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to cancel connection request",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
// Respond to connection request
export const respondToConnection = async (req, res) => {
  try {
    const userId = req.user.id;
    const { connection_id, action } = req.body; // action: 'accept' or 'decline'

    if (!["accept", "decline"].includes(action)) {
      return res
        .status(400)
        .json({ message: "Action must be 'accept' or 'decline'" });
    }

    const status = action === "accept" ? "accepted" : "declined";
    const updated = await updateConnectionStatus(connection_id, status, userId);

    if (!updated) {
      return res.status(404).json({ message: "Connection request not found" });
    }

    res.status(200).json({
      message: `Connection request ${action}ed successfully`,
      status: status,
    });
  } catch (error) {
    console.error("Respond to connection error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get user connections
export const getConnections = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.params;

    const connections = await getUserConnections(userId, status || "accepted");
    if (!connections || connections.length === 0) {
      return res.status(200).json({
        message: "No connections found",
        count: 0,
        connections: [],
      });
    }

    res.status(200).json({
      message: "Connections retrieved successfully",
      count: connections.length,
      connections: connections.map((conn) => {
        const otherUser =
          conn.requester_id === userId
            ? {
                id: conn.receiver_id,
                first_name: conn.receiver_first_name,
                last_name: conn.receiver_last_name,
                profile_picture_url: conn.receiver_profile_pic,
              }
            : {
                id: conn.requester_id,
                first_name: conn.requester_first_name,
                last_name: conn.requester_last_name,
                profile_picture_url: conn.requester_profile_pic,
              };

        return {
          connection_id: conn.connection_id,
          status: conn.status,
          created_at: conn.created_at,
          user: otherUser,
        };
      }),
    });
  } catch (error) {
    console.error("Get connections error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const getAllConnections = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit, offset } = req.query;

    const connections = await getAllUserConnectionsModel(
      userId,
      status,
      limit,
      offset
    );

    // Group connections by status
    const groupedConnections = {
      accepted: [],
      pending: [],
      declined: [],
      blocked: [],
    };

    connections.forEach((conn) => {
      const isRequester = conn.requester_id === userId;

      const otherUser = isRequester
        ? {
            id: conn.receiver_id,
            first_name: conn.receiver_first_name,
            last_name: conn.receiver_last_name,
            profile_picture_url: conn.receiver_profile_pic,
            profile_headline: conn.receiver_headline,
            program: conn.receiver_program,
          }
        : {
            id: conn.requester_id,
            first_name: conn.requester_first_name,
            last_name: conn.requester_last_name,
            profile_picture_url: conn.requester_profile_pic,
            profile_headline: conn.requester_headline,
            program: conn.requester_program,
          };

      const connectionData = {
        connection_id: conn.connection_id,
        status: conn.status,
        connection_note: conn.connection_note,
        shared_courses: conn.shared_courses,
        created_at: conn.created_at,
        updated_at: conn.updated_at,
        user: otherUser,
        your_role: isRequester ? "requester" : "receiver",
        is_pending_action: conn.status === "pending" && !isRequester,
      };

      if (groupedConnections[conn.status]) {
        groupedConnections[conn.status].push(connectionData);
      }
    });

    const counts = {
      accepted: groupedConnections.accepted.length,
      pending: groupedConnections.pending.length,
      declined: groupedConnections.declined.length,
      blocked: groupedConnections.blocked.length,
      total: connections.length,
    };

    const response = {
      message: "All connections retrieved successfully",
      counts,
      connections: groupedConnections,
    };

    // If status filter is applied, only return that status
    if (status && status !== "all" && groupedConnections[status]) {
      response.connections = {
        [status]: groupedConnections[status],
      };
      response.counts = {
        [status]: groupedConnections[status].length,
      };
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("Get all connections error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
// Add course to user profile
export const addCourse = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      course_code,
      course_name,
      department_id,
      semester,
      academic_year,
      is_current,
    } = req.body;

    if (!course_code || !course_name) {
      return res.status(400).json({
        message: "Course code and course name are required",
      });
    }

    // Check if course already exists for this user
    const courseExists = await checkCourseExistsModel(userId, course_code);
    if (courseExists) {
      return res.status(409).json({
        message: "Course already added to profile",
      });
    }

    // Add new course to database
    const newCourse = await addCourseModel({
      user_id: userId,
      course_code,
      course_name,
      department_id,
      semester,
      academic_year,
      is_current: is_current !== undefined ? is_current : true,
    });

    res.status(201).json({
      message: "Course added successfully",
      course: newCourse,
    });
  } catch (error) {
    console.error("Add course error:", error);
    res.status(500).json({
      message: "Internal server error while adding course",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Remove course from user profile
export const removeCourse = async (req, res) => {
  try {
    const userId = req.user.id;
    const courseId = req.params.courseId; // Get from URL parameter

    if (!courseId) {
      return res.status(400).json({
        message: "Course ID is required",
      });
    }

    // Remove course from database using the course ID
    const result = await removeCourseModel(userId, courseId);

    res.status(200).json({
      message: "Course removed successfully",
      removed_course_id: courseId,
      success: true,
    });
  } catch (error) {
    console.error("Remove course error:", error);

    if (
      error.message.includes("Course not found") ||
      error.message.includes("access denied")
    ) {
      return res.status(404).json({
        message: "Course not found or you don't have permission to remove it",
      });
    }
    //error here needs to be fixed cause if the id is not a int it will fail here
    res.status(500).json({
      message: "Internal server error while removing course",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
export const addInterest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { interest_type, interest_name, skill_level } = req.body;

    if (!interest_type || !interest_name) {
      return res.status(400).json({
        message: "Interest type and interest name are required",
      });
    }

    // Use the database model function
    const interest = await addInterestModel(userId, {
      interest_type,
      interest_name,
      skill_level: skill_level || "beginner", // Default skill level
    });

    res.status(201).json({
      message: "Interest added successfully",
      interest: {
        interest_id: interest.interest_id,
        interest_type: interest.interest_type,
        interest_name: interest.interest_name,
        skill_level: interest.skill_level,
      },
    });
  } catch (error) {
    console.error("Add interest error:", error);

    if (
      error.message.includes("Duplicate entry") ||
      error.message.includes("already exists")
    ) {
      return res.status(409).json({
        message: "Interest already added to profile",
      });
    }

    res.status(500).json({
      message: "Internal server error while adding interest",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
export const updateInterest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { interest_id } = req.params;
    const { interest_type, interest_name, skill_level } = req.body;

    if (!interest_id) {
      return res.status(400).json({
        message: "Interest ID is required",
      });
    }

    // Validate at least one field is provided
    if (!interest_type && !interest_name && !skill_level) {
      return res.status(400).json({
        message:
          "At least one field (interest_type, interest_name, or skill_level) is required for update",
      });
    }

    // Prepare update data
    const updateData = {};
    if (interest_type !== undefined) updateData.interest_type = interest_type;
    if (interest_name !== undefined) updateData.interest_name = interest_name;
    if (skill_level !== undefined) updateData.skill_level = skill_level;

    // Use the database model function
    const updatedInterest = await updateInterestModel(
      userId,
      interest_id,
      updateData
    );

    res.status(200).json({
      message: "Interest updated successfully",
      interest: {
        interest_id: updatedInterest.interest_id,
        interest_type: updatedInterest.interest_type,
        interest_name: updatedInterest.interest_name,
        skill_level: updatedInterest.skill_level,
        created_at: updatedInterest.created_at,
      },
    });
  } catch (error) {
    console.error("Update interest error:", error);

    if (error.message.includes("Interest not found")) {
      return res.status(404).json({
        message: "Interest not found or you don't have permission to update it",
      });
    }

    if (
      error.message.includes("Invalid interest_type") ||
      error.message.includes("Invalid skill_level")
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    if (
      error.message.includes("Duplicate entry") ||
      error.message.includes("already exists")
    ) {
      return res.status(409).json({
        message: "An interest with this name already exists in your profile",
      });
    }

    res.status(500).json({
      message: "Internal server error while updating interest",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    // Use the database model function
    const user = await findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Return user data (exclude sensitive information)
    res.status(200).json({
      message: "User retrieved successfully",
      user: {
        // Core Identity
        user_id: user.user_id,
        university_id: user.university_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        gender: user.gender,
        date_of_birth: user.date_of_birth,

        // Profile & Appearance
        profile_picture_url: user.profile_picture_url,
        profile_headline: user.profile_headline,
        bio: user.bio,

        // Academic Information
        program: user.program,
        graduation_year: user.graduation_year,
        year_of_study: user.year_of_study,

        // Contact & Links
        phone_number: user.phone_number,
        linkedin_url: user.linkedin_url,
        website_url: user.website_url,
        social_links: user.social_links,
        interests: user.interests,

        // University Context
        university_name: user.university_name,
        university_domain: user.university_domain,

        // Preferences
        privacy_profile: user.privacy_profile,
        privacy_settings: user.privacy_settings,
        show_location_preference: user.show_location_preference,
        show_status_preference: user.show_status_preference,
        timezone: user.timezone,
        notification_email: user.notification_email,
        notification_push: user.notification_push,

        // Account Status
        is_active: user.is_active,
        is_email_verified: user.is_email_verified,
        is_profile_complete: user.is_profile_complete,

        // Timestamps
        last_login: user.last_login,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({
      message: "Internal server error while retrieving user",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
// Get connection recommendations for user
export const getConnectionRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    // Validate limit
    if (limit < 1 || limit > 50) {
      return res.status(400).json({
        message: "Limit must be between 1 and 50",
        // if this shows then something failed
      });
    }

    // Use the database model function
    const recommendations = await getConnectionRecommendationsModel(
      userId,
      limit
    );

    res.status(200).json({
      message: "Connection recommendations retrieved successfully",
      count: recommendations.length,
      recommendations: recommendations.map((user) => ({
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        profile_picture_url: user.profile_picture_url,
        profile_headline: user.profile_headline,
        program: user.program,
        graduation_year: user.graduation_year,
        match_score: user.match_score,
        match_percentage: Math.min(
          Math.round((user.match_score / 5) * 100),
          100
        ), // Assuming max score of 5
      })),
    });
  } catch (error) {
    console.error("Get connection recommendations error:", error);
    res.status(500).json({
      message:
        "Internal server error while retrieving connection recommendations",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
// Get user statistics
export const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Use the database model function
    const stats = await getUserStatsModel(userId);

    res.status(200).json({
      message: "User statistics retrieved successfully",
      stats: {
        connections: stats.connections,
        groups: stats.groups,
        events: stats.events,
        total_engagement: stats.connections + stats.groups + stats.events,
      },
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({
      message: "Internal server error while retrieving user statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Remove interest from user profile
export const removeInterest = async (req, res) => {
  try {
    const userId = req.user.id;
    const interestId = req.params.interestId; // Get from URL params instead of body

    if (!interestId) {
      return res.status(400).json({
        message: "Interest ID is required",
      });
    }

    // Use the database model function
    const result = await removeInterestModel(userId, interestId);

    res.status(200).json({
      message: "Interest removed successfully",
      removed_interest_id: interestId,
      success: true,
    });
  } catch (error) {
    console.error("Remove interest error:", error);

    if (
      error.message.includes("Interest not found") ||
      error.message.includes("access denied")
    ) {
      return res.status(404).json({
        message: "Interest not found or you don't have permission to remove it",
      });
    }

    res.status(500).json({
      message: "Internal server error while removing interest",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

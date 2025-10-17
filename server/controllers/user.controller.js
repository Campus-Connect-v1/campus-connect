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

// Search users
export const searchUsers = async (req, res) => {
  try {
    const criteria = req.query;
    const users = await searchUsersModel(criteria);

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
    const { receiver_id } = req.body;

    if (!receiver_id) {
      return res.status(400).json({ message: "Receiver ID is required" });
    }

    if (requesterId === receiver_id) {
      return res
        .status(400)
        .json({ message: "Cannot send connection request to yourself" });
    }

    const connectionId = await createConnectionRequest(
      requesterId,
      receiver_id
    );

    res.status(201).json({
      message: "Connection request sent successfully",
      connection_id: connectionId,
    });
  } catch (error) {
    console.error("Send connection error:", error);
    res.status(500).json({ message: "Internal server error" });
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
    const { status } = req.params; // Changed to req.params

    const connections = await getUserConnections(userId, status || "accepted");

    res.status(200).json({
      message: "Connections retrieved successfully",
      count: connections.length,
      connections: connections.map((conn) => {
        const otherUser =
          conn.user_id_1 === userId
            ? {
                id: conn.user_id_2,
                first_name: conn.user2_first_name,
                last_name: conn.user2_last_name,
                profile_picture_url: conn.user2_profile_pic,
              }
            : {
                id: conn.user_id_1,
                first_name: conn.user1_first_name,
                last_name: conn.user1_last_name,
                profile_picture_url: conn.user1_profile_pic,
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

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const userId = req.params;

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
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        profile_picture_url: user.profile_picture_url,
        program: user.program,
        bio: user.bio,
        year_of_study: user.year_of_study,
        graduation_year: user.graduation_year,
        university_id: user.university_id,
        university_name: user.university_name,
        university_domain: user.university_domain,
        is_profile_complete: user.is_profile_complete,
        created_at: user.created_at,
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

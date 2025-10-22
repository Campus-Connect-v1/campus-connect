import { StudyGroup } from "../models/studyGroup.model.js";
import { v4 as uuidv4 } from "uuid";

export const studyGroupController = {
  // Get all study groups with filtering
  getAllStudyGroups: async (req, res) => {
    try {
      const {
        university_id,
        course_code,
        group_type,
        is_active, // Don't set default value here
        page = 1,
        limit = 1000,
      } = req.query;

      const filters = {};
      if (university_id) filters.university_id = university_id;
      if (course_code) filters.course_code = course_code;
      if (group_type) filters.group_type = group_type;

      // Only add is_active filter if explicitly provided
      if (is_active !== undefined) {
        filters.is_active = is_active === "true";
      }
      // If is_active is not provided, don't filter by it (get all groups)

      console.log("🔍 DEBUG - Filters:", filters); // Add this

      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;

      const groups = await StudyGroup.findAll(filters, pageNum, limitNum);

      res.json({
        success: true,
        count: groups.length,
        data: groups,
        pagination: {
          page: pageNum,
          limit: limitNum,
        },
      });
    } catch (error) {
      console.error("Get study groups error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching study groups",
        error: error.message,
      });
    }
  },
  // Get study group by ID
  getStudyGroupById: async (req, res) => {
    try {
      const { groupId } = req.params;
      const group = await StudyGroup.findById(groupId);

      if (!group) {
        return res.status(404).json({
          success: false,
          message: "Study group not found",
        });
      }

      res.json({
        success: true,
        data: group,
      });
    } catch (error) {
      console.error("Get study group error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching study group",
        error: error.message,
      });
    }
  },

  // Create new study group
  createStudyGroup: async (req, res) => {
    try {
      const {
        university_id,
        group_name,
        description,
        course_code,
        course_name,
        group_type = "public",
        max_members = 20,
        meeting_frequency = "weekly",
        preferred_location_type = "campus",
      } = req.body;

      // Validate required fields
      if (!university_id || !group_name) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: university_id, group_name",
        });
      }

      const groupData = {
        group_id: `group_${uuidv4()}`,
        university_id,
        group_name,
        description,
        course_code,
        course_name,
        group_type,
        max_members,
        meeting_frequency,
        preferred_location_type,
        created_by: req.user.id,
      };

      const result = await StudyGroup.create(groupData);

      // Add creator as first member
      await StudyGroup.addMember(groupData.group_id, req.user.id, "creator");

      res.status(201).json({
        success: true,
        message: "Study group created successfully",
        data: { group_id: groupData.group_id, ...groupData },
      });
    } catch (error) {
      console.error("Create study group error:", error);
      res.status(500).json({
        success: false,
        message: "Error creating study group",
        error: error.message,
      });
    }
  },

  // Update study group
  updateStudyGroup: async (req, res) => {
    try {
      const { groupId } = req.params;
      const updateData = req.body;

      // Check if group exists and user is creator/admin
      const group = await StudyGroup.findById(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: "Study group not found",
        });
      }

      const members = await StudyGroup.getMembers(groupId);
      const userMember = members.find((m) => m.user_id === req.user.id);

      if (!userMember || !["creator", "admin"].includes(userMember.role)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this study group",
        });
      }

      const result = await StudyGroup.update(groupId, updateData);

      res.json({
        success: true,
        data: group,
        message: "Study group updated successfully",
      });
    } catch (error) {
      console.error("Update study group error:", error);
      res.status(500).json({
        success: false,
        message: "Error updating study group",
        error: error.message,
      });
    }
  },

  // Join study group
  joinStudyGroup: async (req, res) => {
    try {
      const { groupId } = req.params;

      // Check if group exists and is joinable
      const group = await StudyGroup.findById(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: "Study group not found",
        });
      }

      if (!group.is_active) {
        return res.status(400).json({
          success: false,
          message: "Study group is not active",
        });
      }

      // Check if user is already a member
      const members = await StudyGroup.getMembers(groupId);
      const isMember = members.some((m) => m.user_id === req.user.id);

      if (isMember) {
        return res.status(400).json({
          success: false,
          message: "Already a member of this study group",
        });
      }

      // Check member limit
      if (members.length >= group.max_members) {
        return res.status(400).json({
          success: false,
          message: "Study group has reached maximum members",
        });
      }

      await StudyGroup.addMember(groupId, req.user.id);

      res.json({
        success: true,
        data: group,
        message: "Joined study group successfully",
      });
    } catch (error) {
      console.error("Join study group error:", error);
      res.status(500).json({
        success: false,
        message: "Error joining study group",
        error: error.message,
      });
    }
  },

  // Leave study group
  leaveStudyGroup: async (req, res) => {
    try {
      const { groupId } = req.params;

      // Check if user is a member
      const members = await StudyGroup.getMembers(groupId);
      const userMember = members.find((m) => m.user_id === req.user.id);

      if (!userMember) {
        return res.status(400).json({
          success: false,
          message: "Not a member of this study group",
        });
      }

      // Prevent creator from leaving (they should delete the group instead)
      if (userMember.role === "creator") {
        return res.status(400).json({
          success: false,
          message:
            "Creator cannot leave study group. Delete the group instead.",
        });
      }

      await StudyGroup.removeMember(groupId, req.user.id);

      res.json({
        success: true,
        message: "Left study group successfully",
      });
    } catch (error) {
      console.error("Leave study group error:", error);
      res.status(500).json({
        success: false,
        message: "Error leaving study group",
        error: error.message,
      });
    }
  },

  // Get group members
  getGroupMembers: async (req, res) => {
    try {
      const { groupId } = req.params;

      const members = await StudyGroup.getMembers(groupId);

      res.json({
        success: true,
        count: members.length,
        data: members,
      });
    } catch (error) {
      console.error("Get group members error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching group members",
        error: error.message,
      });
    }
  },

  // Get user's study groups
  getUserStudyGroups: async (req, res) => {
    try {
      const groups = await StudyGroup.getUserGroups(req.user.id);

      res.json({
        success: true,
        count: groups.length,
        data: groups,
      });
    } catch (error) {
      console.error("Get user study groups error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching user study groups",
        error: error.message,
      });
    }
  },
};

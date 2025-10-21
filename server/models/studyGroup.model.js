import db from "../config/db.js";

export class StudyGroup {
  // Get all study groups with filtering
  static async findAll(filters = {}, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT sg.*, u.first_name, u.last_name, uni.name as university_name,
             COUNT(gm.user_id) as member_count
      FROM study_groups sg
      JOIN users u ON sg.created_by = u.user_id
      JOIN universities uni ON sg.university_id = uni.university_id
      LEFT JOIN group_members gm ON sg.group_id = gm.group_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.university_id) {
      query += " AND sg.university_id = ?";
      params.push(filters.university_id);
    }

    if (filters.course_code) {
      query += " AND sg.course_code = ?";
      params.push(filters.course_code);
    }

    if (filters.group_type) {
      query += " AND sg.group_type = ?";
      params.push(filters.group_type);
    }

    if (filters.is_active !== undefined) {
      query += " AND sg.is_active = ?";
      params.push(filters.is_active);
    }

    query +=
      " GROUP BY sg.group_id ORDER BY sg.created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [groups] = await db.execute(query, params);
    return groups;
  }

  // Get study group by ID
  static async findById(groupId) {
    const query = `
      SELECT sg.*, u.first_name, u.last_name, u.profile_picture_url,
             uni.name as university_name,
             COUNT(gm.user_id) as member_count
      FROM study_groups sg
      JOIN users u ON sg.created_by = u.user_id
      JOIN universities uni ON sg.university_id = uni.university_id
      LEFT JOIN group_members gm ON sg.group_id = gm.group_id
      WHERE sg.group_id = ?
      GROUP BY sg.group_id
    `;
    const [groups] = await db.execute(query, [groupId]);
    return groups[0] || null;
  }

  // Create new study group
  static async create(groupData) {
    const {
      group_id,
      university_id,
      group_name,
      description,
      course_code,
      course_name,
      group_type,
      max_members,
      meeting_frequency,
      preferred_location_type,
      created_by,
    } = groupData;

    const query = `
      INSERT INTO study_groups (
        group_id, university_id, group_name, description, course_code,
        course_name, group_type, max_members, meeting_frequency,
        preferred_location_type, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      group_id,
      university_id,
      group_name,
      description,
      course_code,
      course_name,
      group_type,
      max_members,
      meeting_frequency,
      preferred_location_type,
      created_by,
    ];

    const [result] = await db.execute(query, params);
    return result;
  }

  // Update study group
  static async update(groupId, updateData) {
    const allowedFields = [
      "group_name",
      "description",
      "course_code",
      "course_name",
      "group_type",
      "max_members",
      "meeting_frequency",
      "preferred_location_type",
      "is_active",
    ];

    const setClause = [];
    const params = [];

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        setClause.push(`${field} = ?`);
        params.push(updateData[field]);
      }
    });

    if (setClause.length === 0) {
      throw new Error("No valid fields to update");
    }

    setClause.push("updated_at = CURRENT_TIMESTAMP");
    params.push(groupId);

    const query = `UPDATE study_groups SET ${setClause.join(
      ", "
    )} WHERE group_id = ?`;
    const [result] = await db.execute(query, params);
    return result;
  }

  // Get group members
  static async getMembers(groupId) {
    const query = `
      SELECT gm.*, u.first_name, u.last_name, u.profile_picture_url, u.program
      FROM group_members gm
      JOIN users u ON gm.user_id = u.user_id
      WHERE gm.group_id = ?
      ORDER BY 
        CASE gm.role 
          WHEN 'creator' THEN 1
          WHEN 'admin' THEN 2
          ELSE 3 
        END,
        gm.joined_at
    `;
    const [members] = await db.execute(query, [groupId]);
    return members;
  }

  // Add member to group
  static async addMember(groupId, userId, role = "member") {
    const query = `
      INSERT INTO group_members (group_member_id, group_id, user_id, role)
      VALUES (?, ?, ?, ?)
    `;
    const memberId = `gm_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const [result] = await db.execute(query, [memberId, groupId, userId, role]);
    return result;
  }

  // Remove member from group
  static async removeMember(groupId, userId) {
    const query =
      "DELETE FROM group_members WHERE group_id = ? AND user_id = ?";
    const [result] = await db.execute(query, [groupId, userId]);
    return result;
  }

  // Get user's study groups
  static async getUserGroups(userId) {
    const query = `
      SELECT sg.*, gm.role, uni.name as university_name
      FROM study_groups sg
      JOIN group_members gm ON sg.group_id = gm.group_id
      JOIN universities uni ON sg.university_id = uni.university_id
      WHERE gm.user_id = ? AND sg.is_active = true
      ORDER BY sg.updated_at DESC
    `;
    const [groups] = await db.execute(query, [userId]);
    return groups;
  }
}

export default StudyGroup;

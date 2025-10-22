import db from "../config/db.js";

export class Event {
  // Get all events with filtering and pagination
  static async findAll(filters = {}, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT e.*, u.first_name, u.last_name, uni.name as university_name
      FROM events e
      JOIN users u ON e.created_by = u.user_id
      JOIN universities uni ON e.university_id = uni.university_id
      WHERE 1=1
    `;
    const params = [];

    // Apply filters
    if (filters.university_id) {
      query += " AND e.university_id = ?";
      params.push(filters.university_id);
    }

    if (filters.event_type) {
      query += " AND e.event_type = ?";
      params.push(filters.event_type);
    }

    if (filters.start_date) {
      query += " AND e.start_time >= ?";
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      query += " AND e.end_time <= ?";
      params.push(filters.end_date);
    }

    if (filters.is_public !== undefined) {
      query += " AND e.is_public = ?";
      params.push(filters.is_public);
    }

    // Convert limit and offset to numbers explicitly
    query += ` ORDER BY e.start_time ASC LIMIT ${parseInt(
      limit
    )} OFFSET ${parseInt(offset)}`;
    params.push(parseInt(limit), parseInt(offset));

    try {
      const [events] = await db.execute(query, params);
      return events;
    } catch (error) {
      console.error("Database error in Event.findAll:", error);
      throw error;
    }
  }

  // Get event by ID with creator info
  static async findById(eventId) {
    const query = `
      SELECT e.*, u.first_name, u.last_name, u.profile_picture_url, 
             uni.name as university_name
      FROM events e
      JOIN users u ON e.created_by = u.user_id
      JOIN universities uni ON e.university_id = uni.university_id
      WHERE e.event_id = ?
    `;
    try {
      const [events] = await db.execute(query, [eventId]);
      return events[0] || null;
    } catch (error) {
      console.error("Database error in Event.findById:", error);
      throw error;
    }
  }

  // Create new event
  static async create(eventData) {
    const {
      event_id,
      university_id,
      created_by,
      event_title,
      event_description,
      event_type,
      start_time,
      end_time,
      is_recurring,
      recurrence_pattern,
      location_type,
      physical_location,
      virtual_link,
      max_attendees,
      is_public,
      requires_rsvp,
    } = eventData;

    const query = `
    INSERT INTO events (
      event_id, university_id, created_by, event_title, event_description,
      event_type, start_time, end_time, is_recurring, recurrence_pattern,
      location_type, physical_location, virtual_link, max_attendees,
      is_public, requires_rsvp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

    // Convert undefined values to null
    const params = [
      event_id,
      university_id,
      created_by,
      event_title,
      event_description || null, // Convert undefined to null
      event_type || null,
      start_time,
      end_time,
      is_recurring || false,
      recurrence_pattern || null,
      location_type || "physical",
      physical_location || null,
      virtual_link || null,
      max_attendees ? parseInt(max_attendees) : null,
      is_public !== undefined ? is_public : true,
      requires_rsvp !== undefined ? requires_rsvp : false,
    ];

    console.log("🔍 DEBUG - Create event params:", params); // Add this for debugging

    try {
      const [result] = await db.execute(query, params);
      return result;
    } catch (error) {
      console.error("Database error in Event.create:", error);
      throw error;
    }
  }
  // Update event
  static async update(eventId, updateData) {
    const allowedFields = [
      "event_title",
      "event_description",
      "event_type",
      "start_time",
      "end_time",
      "is_recurring",
      "recurrence_pattern",
      "location_type",
      "physical_location",
      "virtual_link",
      "max_attendees",
      "is_public",
      "requires_rsvp",
    ];

    const setClause = [];
    const params = [];

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        setClause.push(`${field} = ?`);
        // Convert max_attendees to number if present
        if (field === "max_attendees" && updateData[field]) {
          params.push(parseInt(updateData[field]));
        } else {
          params.push(updateData[field]);
        }
      }
    });

    if (setClause.length === 0) {
      throw new Error("No valid fields to update");
    }

    setClause.push("updated_at = CURRENT_TIMESTAMP");
    params.push(eventId);

    const query = `UPDATE events SET ${setClause.join(
      ", "
    )} WHERE event_id = ?`;

    try {
      const [result] = await db.execute(query, params);
      return result;
    } catch (error) {
      console.error("Database error in Event.update:", error);
      throw error;
    }
  }

  // Delete event
  static async delete(eventId) {
    const query = "DELETE FROM events WHERE event_id = ?";
    try {
      const [result] = await db.execute(query, [eventId]);
      return result;
    } catch (error) {
      console.error("Database error in Event.delete:", error);
      throw error;
    }
  }

  // Get event attendees
  static async getAttendees(eventId) {
    const query = `
      SELECT ea.*, u.first_name, u.last_name, u.profile_picture_url, u.program
      FROM event_attendees ea
      JOIN users u ON ea.user_id = u.user_id
      WHERE ea.event_id = ?
      ORDER BY ea.created_at DESC
    `;
    try {
      const [attendees] = await db.execute(query, [eventId]);
      return attendees;
    } catch (error) {
      console.error("Database error in Event.getAttendees:", error);
      throw error;
    }
  }

  // RSVP to event
  static async rsvp(eventId, userId, rsvpStatus) {
    const query = `
      INSERT INTO event_attendees (attendee_id, event_id, user_id, rsvp_status)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE rsvp_status = ?, updated_at = CURRENT_TIMESTAMP
    `;
    const attendeeId = `ea_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    try {
      const [result] = await db.execute(query, [
        attendeeId,
        eventId,
        userId,
        rsvpStatus,
        rsvpStatus,
      ]);
      return result;
    } catch (error) {
      console.error("Database error in Event.rsvp:", error);
      throw error;
    }
  }

  // Get user's events
  static async getUserEvents(userId, page = 1, limit = 10) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 10);
    const offset = (pageNum - 1) * limitNum;

    const query = `
    SELECT e.*, ea.rsvp_status, uni.name as university_name
    FROM events e
    JOIN event_attendees ea ON e.event_id = ea.event_id
    JOIN universities uni ON e.university_id = uni.university_id
    WHERE ea.user_id = '${userId}'
    ORDER BY e.start_time ASC
    LIMIT ${limitNum} OFFSET ${offset}
  `;

    try {
      const [events] = await db.execute(query);
      //   console.log("Events user is attending:", events); // for debugging the event failure. but the problem was the req.user.user_id which was wrong. it was req.user.id
      return events;
    } catch (error) {
      console.error("Database error:", error);
      throw error;
    }
  }
}

export default Event;

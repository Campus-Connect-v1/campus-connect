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

    query += " ORDER BY e.start_time ASC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [events] = await db.execute(query, params);
    return events;
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
    const [events] = await db.execute(query, [eventId]);
    return events[0] || null;
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

    const params = [
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
    ];

    const [result] = await db.execute(query, params);
    return result;
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
        params.push(updateData[field]);
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
    const [result] = await db.execute(query, params);
    return result;
  }

  // Delete event
  static async delete(eventId) {
    const query = "DELETE FROM events WHERE event_id = ?";
    const [result] = await db.execute(query, [eventId]);
    return result;
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
    const [attendees] = await db.execute(query, [eventId]);
    return attendees;
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
    const [result] = await db.execute(query, [
      attendeeId,
      eventId,
      userId,
      rsvpStatus,
      rsvpStatus,
    ]);
    return result;
  }

  // Get user's events
  static async getUserEvents(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT e.*, ea.rsvp_status, uni.name as university_name
      FROM events e
      LEFT JOIN event_attendees ea ON e.event_id = ea.event_id AND ea.user_id = ?
      JOIN universities uni ON e.university_id = uni.university_id
      WHERE e.created_by = ? OR ea.user_id = ?
      ORDER BY e.start_time ASC
      LIMIT ? OFFSET ?
    `;
    const [events] = await db.execute(query, [
      userId,
      userId,
      userId,
      limit,
      offset,
    ]);
    return events;
  }
}

export default Event;

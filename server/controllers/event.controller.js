import { v4 as uuidv4 } from "uuid";
import Event from "../models/event.model.js";
import e from "express";

export const eventController = {
  // Get all events with filtering
  getAllEvents: async (req, res) => {
    try {
      const {
        university_id,
        event_type,
        start_date,
        end_date,
        is_public,
        page = 1,
        limit = 100,
      } = req.query;

      const filters = {};
      if (university_id) filters.university_id = university_id;
      if (event_type) filters.event_type = event_type;
      if (start_date) filters.start_date = start_date;
      if (end_date) filters.end_date = end_date;
      if (is_public !== undefined) filters.is_public = is_public === "true";

      const events = await Event.findAll(
        filters,
        parseInt(page),
        parseInt(limit)
      );

      res.json({
        success: true,
        count: events.length,
        data: events,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      console.error("Get events error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching events",
        error: error.message,
      });
    }
  },

  // Get event by ID
  getEventById: async (req, res) => {
    try {
      const { eventId } = req.params;
      const event = await Event.findById(eventId);

      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      res.json({
        success: true,
        data: event,
      });
    } catch (error) {
      console.error("Get event error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching event",
        error: error.message,
      });
    }
  },

  // Create new event
  createEvent: async (req, res) => {
    try {
      const {
        university_id,
        event_title,
        event_description,
        event_type = "academic", // Provide default
        start_time,
        end_time,
        is_recurring = false,
        recurrence_pattern = null, // Explicitly set to null if not provided
        location_type = "physical",
        physical_location = null, // Explicitly set to null if not provided
        virtual_link = null, // Explicitly set to null if not provided
        max_attendees = null, // Explicitly set to null if not provided
        is_public = true,
        requires_rsvp = false,
      } = req.body;

      // Validate required fields
      if (!university_id || !event_title || !start_time || !end_time) {
        return res.status(400).json({
          success: false,
          message:
            "Missing required fields: university_id, event_title, start_time, end_time",
        });
      }

      const eventData = {
        event_id: `event_${uuidv4()}`,
        university_id,
        created_by: req.user.id,
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
      };

      const result = await Event.create(eventData);

      res.status(201).json({
        success: true,
        message: "Event created successfully",
        data: { event_id: eventData.event_id, eventData },
      });
    } catch (error) {
      console.error("Create event error:", error);
      res.status(500).json({
        success: false,
        message: "Error creating event",
        error: error.message,
      });
    }
  },

  // Update event
  updateEvent: async (req, res) => {
    try {
      const { eventId } = req.params;
      const updateData = req.body;

      // Check if event exists and user is creator
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      if (event.created_by !== req.user.user_id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this event",
        });
      }

      const result = await Event.update(eventId, updateData);

      res.json({
        success: true,
        message: "Event updated successfully",
      });
    } catch (error) {
      console.error("Update event error:", error);
      res.status(500).json({
        success: false,
        message: "Error updating event",
        error: error.message,
      });
    }
  },

  // Delete event
  deleteEvent: async (req, res) => {
    try {
      const { eventId } = req.params;

      // Check if event exists and user is creator
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      if (event.created_by !== req.user.user_id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this event",
        });
      }

      await Event.delete(eventId);

      res.json({
        success: true,
        message: "Event deleted successfully",
      });
    } catch (error) {
      console.error("Delete event error:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting event",
        error: error.message,
      });
    }
  },

  // RSVP to event
  rsvpToEvent: async (req, res) => {
    try {
      const { eventId } = req.params;
      const { rsvp_status } = req.body;

      if (!["going", "interested", "not_going"].includes(rsvp_status)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid RSVP status. Must be: going, interested, or not_going",
        });
      }

      // Check if event exists
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      await Event.rsvp(eventId, req.user.id, rsvp_status);

      res.json({
        success: true,
        message: `RSVP status updated to: ${rsvp_status}`,
      });
    } catch (error) {
      console.error("RSVP error:", error);
      res.status(500).json({
        success: false,
        message: "Error updating RSVP",
        error: error.message,
      });
    }
  },

  // Get event attendees
  getEventAttendees: async (req, res) => {
    try {
      const { eventId } = req.params;

      const attendees = await Event.getAttendees(eventId);

      res.json({
        success: true,
        count: attendees.length,
        data: attendees,
      });
    } catch (error) {
      console.error("Get attendees error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching attendees",
        error: error.message,
      });
    }
  },

  // Get user's events
  getUserEvents: async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;

      // Convert to numbers with validation
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.max(1, parseInt(limit) || 10);

      const events = await Event.getUserEvents(req.user.id, pageNum, limitNum);

      res.json({
        success: true,
        count: events.length,
        data: events,

        // events.map((event) => ({
        //   event_id: event.event_id,
        //   title: event.title,
        //   start_time: event.start_time,
        //   end_time: event.end_time,
        // })),
        count: events.length,
        pagination: {
          page: pageNum,
          limit: limitNum,
        },
      });
    } catch (error) {
      console.error("Get user events error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching user events",
        error: error.message,
      });
    }
  },
};
export default Event;

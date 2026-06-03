import { api, request, type ApiResult } from "./api";

/**
 * Events API client. Mirrors server `/api/events` (all require auth).
 * Note: these endpoints wrap payloads in a `{ success, data }` envelope,
 * unlike the social routes. Source: server/controllers/event.controller.js.
 */

export type RsvpStatus = "going" | "interested" | "not_going";

export interface CampusEvent {
  event_id: string;
  university_id: string;
  university_name?: string;
  created_by: string;
  first_name?: string;
  last_name?: string;
  profile_picture_url?: string | null;
  event_title: string;
  event_description: string | null;
  event_type: string;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  location_type: "physical" | "virtual" | string;
  physical_location: string | null;
  virtual_link: string | null;
  max_attendees: number | null;
  is_public: boolean;
  requires_rsvp: boolean;
  // The model may also surface aggregate counts / the caller's rsvp:
  attendee_count?: number;
  going_count?: number;
  user_rsvp_status?: RsvpStatus | null;
}

export interface EventFilters {
  university_id?: string;
  event_type?: string;
  start_date?: string;
  end_date?: string;
  is_public?: boolean;
  page?: number;
  limit?: number;
}

/** List events, optionally filtered (e.g. by university). */
export function getEvents(
  filters: EventFilters = {},
): Promise<ApiResult<CampusEvent[]>> {
  return request(async () => {
    const { data } = await api.get<{ data: CampusEvent[] }>("/events", {
      params: filters,
    });
    return { data: data.data };
  });
}

/** Events the current user created or RSVP'd to. */
export function getMyEvents(
  page = 1,
  limit = 20,
): Promise<ApiResult<CampusEvent[]>> {
  return request(async () => {
    const { data } = await api.get<{ data: CampusEvent[] }>("/events/user", {
      params: { page, limit },
    });
    return { data: data.data };
  });
}

export function getEvent(eventId: string): Promise<ApiResult<CampusEvent>> {
  return request(async () => {
    const { data } = await api.get<{ data: CampusEvent }>(`/events/${eventId}`);
    return { data: data.data };
  });
}

export function rsvpToEvent(
  eventId: string,
  status: RsvpStatus,
): Promise<ApiResult<{ success: boolean; message: string }>> {
  return request(() =>
    api.post(`/events/${eventId}/rsvp`, { rsvp_status: status }),
  );
}

export interface CreateEventInput {
  university_id: string;
  event_title: string;
  event_description?: string;
  event_type?: string;
  start_time: string; // ISO
  end_time: string; // ISO
  location_type?: "physical" | "virtual";
  physical_location?: string;
  virtual_link?: string;
  max_attendees?: number;
  is_public?: boolean;
  requires_rsvp?: boolean;
}

export function createEvent(
  input: CreateEventInput,
): Promise<ApiResult<{ message: string; data: { event_id: string } }>> {
  return request(() => api.post("/events", input));
}

export function updateEvent(
  eventId: string,
  updates: Partial<CreateEventInput>,
): Promise<ApiResult<{ message: string }>> {
  return request(() => api.put(`/events/${eventId}`, updates));
}

export function deleteEvent(eventId: string): Promise<ApiResult<{ message: string }>> {
  return request(() => api.delete(`/events/${eventId}`));
}

export const EVENT_TYPES = [
  "academic",
  "social",
  "sports",
  "career",
  "club",
  "workshop",
] as const;

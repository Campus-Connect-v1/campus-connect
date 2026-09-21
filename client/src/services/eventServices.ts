import { api, request } from "./api";

/** Exactly the shape GET /events returns in `data`. */
export interface ApiEvent {
  event_id: string;
  university_id: string;
  created_by: string;
  event_title: string;
  event_description: string | null;
  event_type: "academic" | "social" | "sports" | "career" | "club" | "workshop";
  start_time: string;
  end_time: string;
  location_type: "physical" | "virtual" | "hybrid";
  physical_location: string | null;
  virtual_link: string | null;
  max_attendees: number | null;
  is_public: boolean | number;
  requires_rsvp: boolean | number;
}

export async function fetchEvents(params?: { university_id?: string; limit?: number }) {
  const result = await request<{ success: boolean; count: number; data: ApiEvent[] }>(() =>
    api.get("/events", { params: { limit: 100, ...params } })
  );
  return result.success ? { ...result, data: result.data.data ?? [] } : result;
}

export async function fetchMyEvents() {
  const result = await request<{ success: boolean; data: ApiEvent[] }>(() =>
    api.get("/events/user")
  );
  return result.success ? { ...result, data: result.data.data ?? [] } : result;
}

export interface CreateEventPayload {
  university_id: string;
  event_title: string;
  event_description?: string;
  event_type?: ApiEvent["event_type"];
  start_time: string;
  end_time: string;
  location_type?: ApiEvent["location_type"];
  physical_location?: string;
  virtual_link?: string;
  max_attendees?: number | null;
  is_public?: boolean;
  requires_rsvp?: boolean;
}

export async function fetchEvent(eventId: string) {
  const result = await request<{ success: boolean; data: ApiEvent }>(() =>
    api.get(`/events/${eventId}`)
  );
  return result.success ? { ...result, data: result.data.data } : result;
}

export function updateEvent(
  eventId: string,
  patch: Partial<Omit<CreateEventPayload, "university_id">>
) {
  return request<{ success: boolean }>(() => api.put(`/events/${eventId}`, patch));
}

export function deleteEvent(eventId: string) {
  return request<{ success: boolean }>(() => api.delete(`/events/${eventId}`));
}

export function createEvent(payload: CreateEventPayload) {
  return request<{ data: ApiEvent }>(() => api.post("/events", payload));
}

export function rsvpToEvent(eventId: string, status: "going" | "maybe" | "not_going" = "going") {
  return request(() => api.post(`/events/${eventId}/rsvp`, { status }));
}

export function fetchAttendees(eventId: string) {
  return request<{ data: unknown[] }>(() => api.get(`/events/${eventId}/attendees`));
}

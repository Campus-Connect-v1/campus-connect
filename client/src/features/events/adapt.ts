import type { ApiEvent } from "@/src/services/eventServices";

import type { CampusEvent } from "./types";

const IMAGE_FOR: Record<ApiEvent["event_type"], string> = {
  sports:
    "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=900&q=70&auto=format&fit=crop",
  social:
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=900&q=70&auto=format&fit=crop",
  academic:
    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=900&q=70&auto=format&fit=crop",
  workshop:
    "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=900&q=70&auto=format&fit=crop",
  career:
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=900&q=70&auto=format&fit=crop",
  club: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=900&q=70&auto=format&fit=crop",
};

function bucket(startIso: string): CampusEvent["day"] {
  const start = new Date(startIso);
  const today = new Date();
  const dayDiff = Math.floor(
    (new Date(start.toDateString()).getTime() - new Date(today.toDateString()).getTime()) / 86400000
  );
  if (dayDiff <= 0) return "Today";
  if (dayDiff === 1) return "Tomorrow";
  return "This week";
}

export function adaptEvent(event: ApiEvent): CampusEvent {
  return {
    event_id: event.event_id,
    title: event.event_title,
    starts_at: new Date(event.start_time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    location: event.physical_location ?? (event.location_type === "virtual" ? "Online" : "Campus"),
    // The events table has no image column, so the type picks a stand-in.
    // Replace once the API returns a cover image.
    image: IMAGE_FOR[event.event_type] ?? IMAGE_FOR.social,
    host: event.event_type,
    attendees: 0,
    going: false,
    day: bucket(event.start_time),
  };
}

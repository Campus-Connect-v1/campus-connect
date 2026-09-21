export interface CampusEvent {
  event_id: string;
  title: string;
  starts_at: string;
  location: string;
  image: string;
  host: string;
  attendees: number;
  going: boolean;
  /** Section heading the event falls under. */
  day: "Today" | "Tomorrow" | "This week";
}

export interface CampusGroup {
  group_id: string;
  name: string;
  description: string;
  /** Absent for study groups: the table has no image column. */
  image?: string;
  category: string;
  members: number;
  next_meetup: string;
  joined: boolean;
  /** Used to decide whether the viewer may edit the group. */
  createdBy?: string;
  courseName?: string | null;
}

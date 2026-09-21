import type { ApiStudyGroup } from "@/src/services/studyGroupServices";

import type { CampusGroup } from "./types";

const FREQUENCY_LABEL: Record<string, string> = {
  weekly: "Meets weekly",
  biweekly: "Meets every 2 weeks",
  monthly: "Meets monthly",
  custom: "No fixed schedule",
};

export function adaptStudyGroup(group: ApiStudyGroup, joinedIds: Set<string>): CampusGroup {
  const creator = [group.first_name, group.last_name].filter(Boolean).join(" ");

  return {
    group_id: group.group_id,
    name: group.group_name,
    description: group.description ?? "",
    // No image column exists on study_groups. This used to substitute a stock
    // photo per group_type, which meant every group appeared to have a cover
    // its creator never chose. The card now renders a colour block instead.
    image: undefined,
    category: group.course_code ?? (group.group_type === "public" ? "Open" : "Study"),
    // COUNT() comes back as a string over the wire, so it is coerced here
    // rather than at the call site where `.toLocaleString()` would be a no-op.
    members: Number(group.member_count ?? 0),
    next_meetup:
      FREQUENCY_LABEL[group.meeting_frequency ?? ""] ??
      (creator ? `Started by ${creator}` : "No schedule yet"),
    joined: joinedIds.has(group.group_id),
    createdBy: group.created_by,
    courseName: group.course_name ?? null,
  };
}

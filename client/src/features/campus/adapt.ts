import type { ApiBuilding } from "@/src/services/campusServices";

import type { CampusPin } from "./types";

const KIND_FOR: Record<ApiBuilding["building_type"], CampusPin["kind"]> = {
  residential: "hall",
  library: "study",
  academic: "study",
  administrative: "study",
  dining: "social",
  recreational: "social",
  sports: "event",
};

const IMAGE_FOR: Record<CampusPin["kind"], string> = {
  hall: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=70&auto=format&fit=crop",
  study:
    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=200&q=70&auto=format&fit=crop",
  social:
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=200&q=70&auto=format&fit=crop",
  event:
    "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=200&q=70&auto=format&fit=crop",
};

/**
 * Returns null for a building with no coordinates — a pin at 0,0 would drop a
 * marker in the Gulf of Guinea, which looks like a bug rather than missing data.
 */
export function adaptBuilding(building: ApiBuilding): CampusPin | null {
  const latitude = Number(building.latitude);
  const longitude = Number(building.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude === 0 && longitude === 0) return null;

  const kind = KIND_FOR[building.building_type] ?? "study";

  return {
    id: building.building_id,
    label: building.building_name,
    latitude,
    longitude,
    image: IMAGE_FOR[kind],
    count: 0,
    kind,
    code: building.building_code,
    address: building.address,
    description: building.description,
    buildingType: building.building_type,
  };
}

import { api, request } from "./api";

/** Exactly the shape GET /university/:id/buildings returns in `data`. */
export interface ApiBuilding {
  building_id: string;
  university_id: string;
  building_code: string;
  building_name: string;
  address: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  description: string | null;
  building_type:
    | "academic"
    | "administrative"
    | "residential"
    | "recreational"
    | "dining"
    | "library"
    | "sports";
}

export async function fetchBuildings(universityId: string) {
  const result = await request<{ success: boolean; count: number; data: ApiBuilding[] }>(() =>
    api.get(`/university/${universityId}/buildings`)
  );
  return result.success ? { ...result, data: result.data.data ?? [] } : result;
}

/** A room inside a building. */
export interface ApiFacility {
  facility_id: string;
  building_id: string;
  facility_name: string;
  floor: number | null;
  room_number: string | null;
  capacity: number | null;
  facility_type:
    "classroom" | "lab" | "study_room" | "office" | "cafe" | "lounge" | "library" | "gym" | "other";
  description: string | null;
  operating_hours: string | null;
  is_reservable: boolean | number;
  /** Present on the search and type endpoints, which join the building. */
  building_name?: string;
}

export async function fetchBuilding(buildingId: string) {
  const result = await request<{ success: boolean; data: ApiBuilding }>(() =>
    api.get(`/university/buildings/${buildingId}`)
  );
  return result.success ? { ...result, data: result.data.data } : result;
}

export async function fetchBuildingFacilities(buildingId: string, facilityType?: string) {
  const result = await request<{ success: boolean; data: ApiFacility[] }>(() =>
    api.get(`/university/buildings/${buildingId}/facilities`, {
      params: facilityType ? { facility_type: facilityType } : undefined,
    })
  );
  return result.success ? { ...result, data: result.data.data ?? [] } : result;
}

export async function searchFacilities(universityId: string, query: string) {
  const result = await request<{ success: boolean; data?: ApiFacility[] }>(() =>
    api.get(`/university/${universityId}/facilities/search`, { params: { q: query } })
  );
  return result.success ? { ...result, data: result.data.data ?? [] } : result;
}

export async function fetchFacilitiesByType(universityId: string, facilityType: string) {
  const result = await request<{ success: boolean; data?: ApiFacility[] }>(() =>
    api.get(`/university/${universityId}/facilities/type`, {
      params: { facility_type: facilityType },
    })
  );
  return result.success ? { ...result, data: result.data.data ?? [] } : result;
}

export async function fetchReservableFacilities(universityId: string) {
  const result = await request<{ success: boolean; data?: ApiFacility[] }>(() =>
    api.get(`/university/${universityId}/facilities/reservable`)
  );
  return result.success ? { ...result, data: result.data.data ?? [] } : result;
}

export async function searchBuildings(universityId: string, query: string) {
  const result = await request<{ success: boolean; data?: ApiBuilding[] }>(() =>
    api.get(`/university/${universityId}/buildings/search`, { params: { q: query } })
  );
  return result.success ? { ...result, data: result.data.data ?? [] } : result;
}

import { api, request, type ApiResult } from "./api";

/**
 * Campus directory client — university buildings & facilities.
 * Routes under `/api/university` (auth required).
 * Source: server/controllers/university.controller.js (campusController).
 */

export interface CampusBuilding {
  building_id: string;
  building_name: string;
  building_type?: string | null;
  description?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  image_url?: string | null;
  [key: string]: unknown;
}

export function getBuildings(
  universityId: string,
  buildingType?: string,
): Promise<ApiResult<CampusBuilding[]>> {
  return request(async () => {
    const { data } = await api.get<{ data: CampusBuilding[] }>(
      `/university/${universityId}/buildings`,
      { params: buildingType ? { building_type: buildingType } : undefined },
    );
    return { data: data.data };
  });
}

export function getBuilding(
  buildingId: string,
): Promise<ApiResult<CampusBuilding>> {
  return request(async () => {
    const { data } = await api.get<{ data: CampusBuilding }>(
      `/university/buildings/${buildingId}`,
    );
    return { data: data.data };
  });
}

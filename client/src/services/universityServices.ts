import { api } from "./authServices";

export interface Building {
  building_id: string;
  building_name: string;
  building_code: string;
  building_type: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  floors?: number;
  accessibility_features?: string[];
  operating_hours?: {
    weekday?: string;
    weekend?: string;
  };
}

export interface Facility {
  facility_id: string;
  building_id: string;
  building_name: string;
  facility_type: string;
  room_number?: string;
  floor?: number;
  capacity?: number;
  is_reservable: boolean;
  equipment?: string[];
  accessibility_features?: string[];
  operating_hours?: {
    weekday?: string;
    weekend?: string;
  };
}

export const universityServices = {
  // Get all buildings for a university
  getBuildings: async (universityId: string, buildingType?: string) => {
    try {
      const params = buildingType ? `?building_type=${buildingType}` : '';
      const response = await api.get(`/university/${universityId}/buildings${params}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || "Failed to fetch buildings" };
    }
  },

  // Search buildings
  searchBuildings: async (universityId: string, searchTerm: string) => {
    try {
      const response = await api.get(`/university/${universityId}/buildings/search?q=${searchTerm}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || "Failed to search buildings" };
    }
  },

  // Get building by ID
  getBuildingById: async (buildingId: string) => {
    try {
      const response = await api.get(`/university/buildings/${buildingId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || "Failed to fetch building" };
    }
  },

  // Get facilities by building
  getFacilitiesByBuilding: async (buildingId: string, facilityType?: string) => {
    try {
      const params = facilityType ? `?facility_type=${facilityType}` : '';
      const response = await api.get(`/university/buildings/${buildingId}/facilities${params}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || "Failed to fetch facilities" };
    }
  },

  // Get facility by ID
  getFacilityById: async (facilityId: string) => {
    try {
      const response = await api.get(`/university/facilities/${facilityId}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || "Failed to fetch facility" };
    }
  },

  // Search facilities
  searchFacilities: async (universityId: string, searchTerm: string) => {
    try {
      const response = await api.get(`/university/${universityId}/facilities/search?q=${searchTerm}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || "Failed to search facilities" };
    }
  },

  // Get facilities by type
  getFacilitiesByType: async (universityId: string, facilityType: string) => {
    try {
      const response = await api.get(`/university/${universityId}/facilities/type?facility_type=${facilityType}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || "Failed to fetch facilities" };
    }
  },

  // Get reservable facilities
  getReservableFacilities: async (universityId: string) => {
    try {
      const response = await api.get(`/university/${universityId}/facilities/reservable`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || "Failed to fetch reservable facilities" };
    }
  },
};

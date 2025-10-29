import { api } from "./authServices";

export interface NearbyUser {
  user_id: string;
  first_name: string;
  last_name: string;
  profile_picture_url?: string;
  program?: string;
  year_of_study?: string;
  distance: number;
  accuracy: number;
  last_seen: string;
  coordinates: [number, number] | null;
  latitude: number | null;
  longitude: number | null;
}

export interface NearbyUsersResponse {
  message: string;
  count: number;
  radius: number;
  profiles: NearbyUser[];
}

export const locationServices = {
  // Get nearby users
  getNearbyUsers: async (radius: number = 5000) => {
    try {
      const response = await api.get<NearbyUsersResponse>(`/geofencing/nearby?radius=${radius}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || "Failed to fetch nearby users" };
    }
  },

  // Update user location
  updateLocation: async (latitude: number, longitude: number, accuracy?: number) => {
    try {
      const response = await api.post("/geofencing/location", {
        latitude,
        longitude,
        accuracy,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || "Failed to update location" };
    }
  },
};

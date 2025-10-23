// services/LocationService.js
import { UserLocation } from "../models/location.js";
import redisClient from "../config/redis.js"; // Your Redis client

export class LocationService {
  // Update user location with last_seen timestamp
  async updateUserLocation(userId, coordinates, accuracy = 50) {
    const [longitude, latitude] = coordinates;

    // Rate limiting check (existing code)...

    const locationData = {
      user_id: userId,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      accuracy,
      last_updated: new Date(),
      last_seen: new Date(), // Add last_seen field
      is_active: true,
    };

    const result = await UserLocation.findOneAndUpdate(
      { user_id: userId },
      locationData,
      { upsert: true, new: true }
    );

    // Cache the updated location
    await this.cacheUserLocation(userId, result);

    // Clear nearby users cache for this user
    await this.clearNearbyCache(userId);

    return result;
  }

  // Cache user location in Redis
  async cacheUserLocation(userId, locationData) {
    const cacheKey = `user_location:${userId}`;
    await redisClient.setex(
      cacheKey,
      300, // 5 minutes TTL
      JSON.stringify({
        coordinates: locationData.location.coordinates,
        last_updated: locationData.last_updated,
        last_seen: locationData.last_seen,
        accuracy: locationData.accuracy,
      })
    );
  }

  // Get cached user location
  async getCachedUserLocation(userId) {
    const cacheKey = `user_location:${userId}`;
    const cached = await redisClient.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  }

  // Enhanced nearby users with campus context
  async findNearbyUsers(userId, radius = 100) {
    const cacheKey = `nearby_users:${userId}:${radius}`;

    // Check Redis cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const userLocation = await UserLocation.findOne({
      user_id: userId,
      is_active: true,
    });

    if (!userLocation) {
      throw new Error("User location not found");
    }

    // Find nearby users with active status based on last_seen
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const nearbyUsers = await UserLocation.aggregate([
      {
        $geoNear: {
          near: userLocation.location,
          distanceField: "distance",
          maxDistance: radius,
          spherical: true,
          query: {
            user_id: { $ne: userId },
            location_sharing_enabled: true,
            last_seen: { $gte: fifteenMinutesAgo }, // Only recently active users
          },
        },
      },
      {
        $project: {
          user_id: 1,
          distance: 1,
          accuracy: 1,
          last_updated: 1,
          last_seen: 1,
          coordinates: "$location.coordinates",
        },
      },
    ]);

    // Cache in Redis for 30 seconds
    await redisClient.setex(cacheKey, 30, JSON.stringify(nearbyUsers));

    return nearbyUsers;
  }

  // Clear nearby cache when location updates
  async clearNearbyCache(userId) {
    const pattern = `nearby_users:${userId}:*`;
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  }

  // Get user's current building based on location
  async getUserBuilding(userId) {
    const userLocation = await UserLocation.findOne({ user_id: userId });
    if (!userLocation) return null;

    const [longitude, latitude] = userLocation.location.coordinates;

    // Query campus_buildings to find which building user is in
    // This would use your MySQL campus_buildings table
    // You'd need to implement this spatial query based on your DB
    return await this.findBuildingByCoordinates(latitude, longitude);
  }

  // Toggle incognito mode (one-touch privacy)
  async toggleIncognitoMode(userId, enabled) {
    const result = await UserLocation.findOneAndUpdate(
      { user_id: userId },
      {
        location_sharing_enabled: !enabled,
        is_active: !enabled, // Also mark as inactive if incognito
      },
      { new: true, upsert: true }
    );

    // Clear all caches for this user
    await this.clearUserCaches(userId);

    return result;
  }

  async clearUserCaches(userId) {
    await Promise.all([
      this.clearNearbyCache(userId),
      redisClient.del(`user_location:${userId}`),
      redisClient.del(`user_privacy:${userId}`),
    ]);
  }

  async toggleLocationSharing(userId, enabled) {
    const userLocation = await UserLocation.findOneAndUpdate(
      { user_id: userId },
      { location_sharing_enabled: enabled },
      { new: true, upsert: true }
    );

    if (!userLocation) {
      throw new Error("User location record not found or could not be created");
    }

    return {
      message: `Location sharing ${
        enabled ? "enabled" : "disabled"
      } successfully`,
      user_id: userId,
      location_sharing_enabled: userLocation.location_sharing_enabled,
    };
  }

  // Get user's location history (last N records)
  async getLocationHistory(userId, limit = 20) {
    // Validate user
    if (!userId) {
      throw new Error("User ID is required");
    }

    // Fetch location history sorted by last_updated descending
    const history = await UserLocation.find({ user_id: userId })
      .sort({ last_updated: -1 })
      .limit(limit)
      .select("location accuracy last_updated is_active")
      .lean();

    if (!history || history.length === 0) {
      throw new Error("No location history found for this user");
    }

    return history.map((record) => ({
      longitude: record.location.coordinates[0],
      latitude: record.location.coordinates[1],
      accuracy: record.accuracy,
      last_updated: record.last_updated,
      active: record.is_active || false,
    }));
  }
}

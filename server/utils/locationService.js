// services/LocationService.js
import { UserLocation } from "../models/location.js"; // MongoDB model

export class LocationService {
  // Update user location in MongoDB with rate limiting
  async updateUserLocation(userId, coordinates, accuracy = 50) {
    const [longitude, latitude] = coordinates;

    // Rate limiting: Check last update time
    const lastUpdate = await UserLocation.findOne({
      user_id: userId,
    }).sort({ last_updated: -1 });

    if (lastUpdate) {
      const timeDiff = Date.now() - lastUpdate.last_updated.getTime();
      // Limit updates to once every 30 seconds
      if (timeDiff < 30000) {
        throw new Error(
          "Location update too frequent. Please wait 30 seconds."
        );
      }
    }

    const locationData = {
      user_id: userId,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      accuracy,
      last_updated: new Date(),
    };

    // Upsert location data in MongoDB
    const result = await UserLocation.findOneAndUpdate(
      { user_id: userId },
      locationData,
      { upsert: true, new: true }
    );

    return result;
  }

  // Find nearby users using MongoDB geospatial queries
  async findNearbyUsers(userId, radius = 100) {
    const cacheKey = `nearby_users:${userId}:${radius}`;

    // Check cache first
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    // Get user's location from MongoDB
    const userLocation = await UserLocation.findOne({
      user_id: userId,
      is_active: true,
    });

    if (!userLocation) {
      throw new Error("User location not found");
    }

    // Find nearby users using MongoDB geospatial query
    const nearbyUsers = await UserLocation.find({
      location: {
        $near: {
          $geometry: userLocation.location,
          $maxDistance: radius,
        },
      },
      user_id: { $ne: userId },
      is_active: true,
      location_sharing_enabled: true,
    })
      .select("user_id distance accuracy last_updated")
      .lean();

    // Cache results for 30 seconds
    await this.setCache(cacheKey, nearbyUsers, 30);

    return nearbyUsers;
  }

  // Calculate distance between two users
  async calculateDistance(userId1, userId2) {
    const [user1, user2] = await Promise.all([
      UserLocation.findOne({ user_id: userId1 }),
      UserLocation.findOne({ user_id: userId2 }),
    ]);

    if (!user1 || !user2) {
      return Infinity;
    }

    return this.calculateHaversineDistance(
      user1.location.coordinates[1],
      user1.location.coordinates[0],
      user2.location.coordinates[1],
      user2.location.coordinates[0]
    );
  }

  // Haversine distance calculation
  calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  // Simple in-memory cache (replace with Redis in production)
  async getFromCache(key) {
    // Implement Redis or memory cache
    return null;
  }

  async setCache(key, value, ttlSeconds) {
    // Implement Redis or memory cache right here. but the fronend dev might need to secure these in the expo-secured-headers plugin
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

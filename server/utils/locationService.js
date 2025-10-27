// utils/locationService.js

import { UserLocation } from "../models/location.js";
import redisClient from "../config/redis.js";

export class LocationService {
  // Update user location with last_seen timestamp
  async updateUserLocation(userId, coordinates, accuracy = 50) {
    const [longitude, latitude] = coordinates;

    // Rate limiting check (existing code)...
    const existingLocation = await UserLocation.findOne({ user_id: userId });
    if (existingLocation) {
      const timeDiff = Date.now() - existingLocation.last_updated.getTime();
      if (timeDiff < 30000) {
        // 30 second cooldown
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
      last_seen: new Date(),
      is_active: true,
    };

    const result = await UserLocation.findOneAndUpdate(
      { user_id: userId },
      locationData,
      { upsert: true, new: true }
    );

    // Cache the updated location with consistent format
    await this.cacheUserLocation(userId, result);

    // Clear nearby users cache for this user
    await this.clearNearbyCache(userId);

    return result;
  }

  // Cache user location in Redis with consistent format
  async cacheUserLocation(userId, locationData) {
    const cacheKey = `user_location:${userId}`;
    const cacheData = {
      latitude: locationData.location.coordinates[1],
      longitude: locationData.location.coordinates[0],
      last_updated: locationData.last_updated,
      last_seen: locationData.last_seen,
      accuracy: locationData.accuracy,
    };

    await redisClient.setex(
      cacheKey,
      1800, // 30 minutes TTL
      JSON.stringify(cacheData)
    );
  }

  // Get cached user location
  async getCachedUserLocation(userId) {
    const cacheKey = `user_location:${userId}`;
    const cached = await redisClient.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  }

  // Enhanced nearby users with campus context
  async findNearbyUsers(userId, radius = 500) {
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

    // Find nearby users with active status
    const nearbyUsers = await UserLocation.aggregate([
      {
        $geoNear: {
          near: userLocation.location,
          distanceField: "distance",
          maxDistance: radius,
          spherical: true,
          key: "location",
          query: {
            user_id: { $ne: userId },
            location_sharing_enabled: true,
            is_active: true,
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
    await redisClient.setex(cacheKey, 1800, JSON.stringify(nearbyUsers));

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

  // Calculate distance between two users
  async calculateDistanceBetweenUsers(userId1, userId2) {
    try {
      // Get both users' locations
      const [user1, user2] = await Promise.all([
        UserLocation.findOne({ user_id: userId1 }),
        UserLocation.findOne({ user_id: userId2 }),
      ]);

      if (!user1 || !user2) {
        console.log(
          `❌ Could not find locations for users: ${userId1}, ${userId2}`
        );
        return Infinity;
      }

      // Extract coordinates
      const [lon1, lat1] = user1.location.coordinates;
      const [lon2, lat2] = user2.location.coordinates;

      // Calculate distance using Haversine formula
      return this.calculateHaversineDistance(lat1, lon1, lat2, lon2);
    } catch (error) {
      console.error("❌ Error calculating distance:", error);
      return Infinity;
    }
  }

  // Haversine distance calculation
  calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
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

  // Simple distance calculation for coordinates (used by PrivacyService)
  calculateDistance(lat1, lon1, lat2, lon2) {
    return this.calculateHaversineDistance(lat1, lon1, lat2, lon2);
  }

  // Get user's current building based on location
  async getUserBuilding(userId) {
    const userLocation = await UserLocation.findOne({ user_id: userId });
    if (!userLocation) return null;

    const [longitude, latitude] = userLocation.location.coordinates;
    return await this.findBuildingByCoordinates(latitude, longitude);
  }

  // Toggle incognito mode (one-touch privacy)
  async toggleIncognitoMode(userId, enabled) {
    const result = await UserLocation.findOneAndUpdate(
      { user_id: userId },
      {
        location_sharing_enabled: !enabled,
        is_active: !enabled,
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

  // Get user's location history
  async getLocationHistory(userId, hours = 24) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const timeThreshold = new Date(Date.now() - hours * 60 * 60 * 1000);

    const history = await UserLocation.find({
      user_id: userId,
      last_updated: { $gte: timeThreshold },
    })
      .sort({ last_updated: -1 })
      .select("location accuracy last_updated is_active")
      .lean();

    if (!history || history.length === 0) {
      return [];
    }

    return history.map((record) => ({
      longitude: record.location.coordinates[0],
      latitude: record.location.coordinates[1],
      accuracy: record.accuracy,
      last_updated: record.last_updated,
      active: record.is_active || false,
    }));
  }

  async findBuildingByCoordinates(latitude, longitude) {
    try {
      // Mock implementation - replace with actual spatial queries
      const mockBuildings = [
        {
          building_name: "Main Library",
          building_type: "academic",
          coordinates: { lat: 37.4275, lon: -122.1697 },
        },
        {
          building_name: "Student Center",
          building_type: "student_life",
          coordinates: { lat: 37.428, lon: -122.17 },
        },
        {
          building_name: "Science Building",
          building_type: "academic",
          coordinates: { lat: 37.4265, lon: -122.1685 },
        },
      ];

      let closestBuilding = null;
      let minDistance = Infinity;

      for (const building of mockBuildings) {
        const distance = this.calculateHaversineDistance(
          latitude,
          longitude,
          building.coordinates.lat,
          building.coordinates.lon
        );

        if (distance < minDistance && distance < 100) {
          minDistance = distance;
          closestBuilding = building;
        }
      }

      return (
        closestBuilding || {
          building_name: "On Campus",
          building_type: "campus",
        }
      );
    } catch (error) {
      console.error("Error finding building:", error);
      return { building_name: "On Campus", building_type: "campus" };
    }
  }

  async getUserLocationFromDB(userId) {
    try {
      const userLocation = await UserLocation.findOne({
        user_id: userId,
        is_active: true,
      });

      if (!userLocation) {
        // console.log(`📍 No location found in DB for user: ${userId}`);
        return null;
      }

      // console.log(`📍 Found location in DB for ${userId}:`, {
      //   coordinates: userLocation.location.coordinates,
      //   last_updated: userLocation.last_updated,
      // });

      return userLocation;
    } catch (error) {
      console.error(`❌ Error fetching location from DB for ${userId}:`, error);
      return null;
    }
  }

  async getUserLocationWithFallback(userId) {
    try {
      // 1. Try cached location first
      let location = await this.getCachedUserLocation(userId);

      if (location) {
        return location;
      }

      // 2. Fallback to database
      console.log(`📍 No cached location for ${userId}, checking database...`);
      const userLocation = await this.getUserLocationFromDB(userId);

      if (userLocation) {
        // Transform to consistent format
        location = {
          latitude: userLocation.location.coordinates[1],
          longitude: userLocation.location.coordinates[0],
          last_updated: userLocation.last_updated,
          last_seen: userLocation.last_seen,
          accuracy: userLocation.accuracy,
        };

        // Cache for future use
        await this.cacheUserLocation(userId, userLocation);
        console.log(`💾 Retrieved and cached location from DB for ${userId}`);
        return location;
      }

      console.log(`❌ No location found in DB for user: ${userId}`);
      return null;
    } catch (error) {
      console.error(`❌ Error getting location for ${userId}:`, error.message);
      return null;
    }
  }
}

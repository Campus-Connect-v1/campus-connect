// models/Location.js (MongoDB)
import mongoose from "mongoose";

const userLocationSchema = new mongoose.Schema(
  {
    user_id: {
      type: String, // References MySQL user_id
      required: true,
      index: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        index: "2dsphere",
      },
    },
    accuracy: {
      type: Number,
      default: 50, // meters
    },
    last_updated: {
      type: Date,
      default: Date.now,
      index: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    geofence_radius: {
      type: Number,
      default: 100, // meters
    },
    location_sharing_enabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Geospatial index for location queries
userLocationSchema.index({ location: "2dsphere" });
// Compound index for active users
userLocationSchema.index({ user_id: 1, is_active: 1 });

export const UserLocation = mongoose.model("UserLocation", userLocationSchema);

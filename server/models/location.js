// models/location.js

import mongoose from "mongoose";

const userLocationSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    accuracy: {
      type: Number,
      default: 50,
    },
    last_updated: {
      type: Date,
      default: Date.now,
      index: true,
    },
    last_seen: {
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
      default: 100,
    },
    location_sharing_enabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    autoIndex: false,
  }
);

// Geospatial index for location queries
userLocationSchema.index({ location: "2dsphere" });
// Compound index for active users
userLocationSchema.index({ user_id: 1, is_active: 1 });
userLocationSchema.index({ last_updated: 1 });

export const UserLocation = mongoose.model("UserLocation", userLocationSchema);

// config/mongoDB.js
import mongoose from "mongoose";

import dotenv from "dotenv";
dotenv.config();
const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      //   useNewUrlParser: true,
      //   useUnifiedTopology: true,
    });
    console.log("MongoDB connected for geofencing");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectMongoDB;

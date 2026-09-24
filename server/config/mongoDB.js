// config/mongoDB.js
import mongoose from "mongoose";
import { COLORS } from "../helper/logger.js";
import dotenv from "dotenv";
dotenv.config();
const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      //   useNewUrlParser: true,
      //   useUnifiedTopology: true,
    });

    // UserLocation disables Mongoose's automatic index creation so production
    // startup does not attempt to reconcile every model. Nearby discovery is
    // the exception: MongoDB requires a 2dsphere index before `$geoNear` can
    // execute at all. Creating the one required index is idempotent and keeps
    // a fresh deployment from returning 500 for every nearby request.
    await mongoose.connection
      .collection("userlocations")
      .createIndex({ location: "2dsphere" }, { name: "location_2dsphere" });

    console.log(
      COLORS[process.env.SUCCESS],
      "MongoDB connected for geofencing"
    );
  } catch (error) {
    console.error(
      COLORS[process.env.ERROR],
      "MongoDB connection error:",
      error
    );
    // process.exit(1);
    // the mongo failure shoul be logged i do not want it to stop my local running sevr. but in prod it will
  }
};

export default connectMongoDB;

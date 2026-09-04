import mongoose from "mongoose";

const connectMongoDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined");
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown MongoDB error";
    console.error("Failed to connect to MongoDB:", message);
    throw error;
  }
};

export default connectMongoDB;

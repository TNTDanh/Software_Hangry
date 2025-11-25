import dotenv from "dotenv";
dotenv.config();

import { v2 as cloudinary } from "cloudinary";

export function setupCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const enabled = Boolean(cloudName && apiKey && apiSecret);

  if (enabled) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    console.log("[Cloudinary] Configured (using Cloudinary).");
  } else {
    console.warn("[Cloudinary] Missing credentials → fallback to local uploads");
  }

  return { cloudinary, enabled };
}

export default cloudinary;
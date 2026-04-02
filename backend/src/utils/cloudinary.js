import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error(
    "Cloudinary credentials are missing. Set CLOUDINARY_CLOUD_NAME (or CLOUDINARY_NAME), CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env."
  );
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

const uploadToCloudinary = (buffer, folder = "krishibazaar/crops") => {
  if (!buffer) return Promise.resolve(undefined);
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result?.secure_url);
      }
    );
    stream.end(buffer);
  });
};

const uploadMultipleToCloudinary = async (buffers, folder = "krishibazaar/crops") => {
  if (!buffers || buffers.length === 0) return [];
  const validBuffers = buffers.filter(Boolean);
  const urls = await Promise.all(validBuffers.map((buf) => uploadToCloudinary(buf, folder)));
  return urls.filter(Boolean);
};

const deleteFromCloudinary = async (imageUrl) => {
  try {
    const urlParts = imageUrl.split("/");
    const filenameWithExt = urlParts[urlParts.length - 1];
    const folderName = urlParts[urlParts.length - 2];
    const publicId = `${folderName}/${filenameWithExt.split(".")[0]}`;

    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary delete failed:", error);
  }
};

export { uploadToCloudinary, uploadMultipleToCloudinary, deleteFromCloudinary };
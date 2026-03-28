import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
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
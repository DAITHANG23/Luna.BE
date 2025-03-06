import cloudinary from "cloudinary";
import { CloudinaryUploadResult } from "../types";

const initialzeCloudinary = () => {
  cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};
initialzeCloudinary();

const uploadSingleImage = (
  buffer: Buffer,
  folder = "uploads"
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        folder: folder,
        width: 150,
        height: 150,
        crop: "fill",
        gravity: "auto",
      },
      (error, result) => {
        if (error || !result) {
          console.error("Cloudinary upload error:", error);
          return reject(new Error("Upload failed"));
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );
    uploadStream.end(buffer);
  });
};

const uploadMultipleImages = async (
  filePaths: Array<string>,
  folder = "multipleUploads"
) => {
  try {
    const uploadPromises = filePaths.map((filePath) =>
      cloudinary.v2.uploader.upload(filePath, {
        folder: folder,
        width: 150,
        height: 150,
        crop: "fill",
        gravity: "auto",
      })
    ) as Promise<CloudinaryUploadResult>[];

    const results = await Promise.all(uploadPromises);

    return results.map((result: CloudinaryUploadResult) => ({
      url: result.secure_url,
      public_id: result.public_id,
    }));
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Upload failed");
  }
};

export { uploadSingleImage, uploadMultipleImages };

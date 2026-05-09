// middleware/upload.js
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  // params MUST be a function — passing a plain object causes
  // multer-storage-cloudinary to silently ignore resource_type,
  // so PDFs get saved under "image" instead of "raw".
  params: (req, file) => {
    const isPDF = file.mimetype === "application/pdf";
    return {
      folder: "class-site-uploads",
      resource_type: isPDF ? "raw" : "image", // "raw" is required for PDFs
      // Keep the original filename (without extension — Cloudinary adds it)
      public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, "")}`,
    };
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});
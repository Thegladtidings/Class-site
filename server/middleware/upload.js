// middleware/upload.js
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "class-site-uploads",
    resource_type: "auto", // VERY IMPORTANT (supports pdf, docs, images)
  },
});

export const upload = multer({ storage });
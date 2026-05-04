// config/cloudinary.js
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.Cloudinary_name,
  api_key: process.env.Cloudinary_key,
  api_secret: process.env.Cloudinary_secret,
});

export default cloudinary;
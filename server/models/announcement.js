// models/announcement.js
import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema({
  title:        { type: String, required: true },
  message:      { type: String, required: true },
  type:         { type: String, enum: ["notice", "best_student", "result", "event"], default: "notice" },
  studentName:  { type: String, default: null },
  studentPhoto: { type: String, default: null }, // URL string
  postedBy:     { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
}, { timestamps: true });

export default mongoose.model("Announcement", announcementSchema);
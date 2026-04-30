import mongoose from "mongoose";
const { Schema } = mongoose;

const announcementSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["best_student", "notice", "result", "event"],
    required: true,
  },
  title:     { type: String, required: true },
  body:      { type: String },
  student:   { type: Schema.Types.ObjectId, ref: "Student", default: null },
  className: { type: String },
  isPinned:  { type: Boolean, default: false },
  expiresAt: { type: Date },
}, { timestamps: true });

const Announcement = mongoose.model("Announcement", announcementSchema);
export default Announcement;

import mongoose from "mongoose";
const { Schema } = mongoose;

const assignmentSchema = new mongoose.Schema({
  title:          { type: String, required: true },
  subject:        { type: String, required: true },
  description:    { type: String },
  dueDate:        { type: Date },
  className:      { type: String, required: true },
  attachmentUrl:  { type: String },                     // PDF/image link (Cloudinary etc.)
  attachmentName: { type: String },                     // original filename
  postedBy:       { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
  isActive:       { type: Boolean, default: true },
}, { timestamps: true });

const Assignment = mongoose.model("Assignment", assignmentSchema);
export default Assignment;

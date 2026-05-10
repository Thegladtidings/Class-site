// models/Subject.js
import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, "Subject name is required"],
      trim:     true,
      unique:   true,           // global list — no duplicates
    },
    code: {
      type:  String,
      trim:  true,
      default: "",              // optional short code e.g. "MTH"
    },
    isActive: {
      type:    Boolean,
      default: true,            // soft-delete / hide without destroying data
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "User",             // whichever admin/teacher created it
    },
  },
  { timestamps: true }
);

// Case-insensitive unique index on name
subjectSchema.index({ name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });

const Subject = mongoose.model("Subject", subjectSchema);

export default Subject;
import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Case-insensitive unique index (correct way)
subjectSchema.index(
  { name: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

const Subject = mongoose.model("Subject", subjectSchema);

export default Subject;
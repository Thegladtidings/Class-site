import mongoose from "mongoose";

const classSessionSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  subject: { type: String, required: true, trim: true, maxlength: 120 },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  durationMinutes: { type: Number, required: true, min: 15, max: 240 },
  notes: { type: String, trim: true, maxlength: 1000, default: "" },
  status: {
    type: String,
    enum: ["scheduled", "cancelled"],
    default: "scheduled",
    index: true,
  },
}, { timestamps: true });

classSessionSchema.index({ teacher: 1, startsAt: 1 });
classSessionSchema.index({ student: 1, startsAt: 1 });

const ClassSession = mongoose.model("ClassSession", classSessionSchema);
export default ClassSession;

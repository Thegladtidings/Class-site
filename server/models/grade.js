import mongoose from "mongoose";
const { Schema } = mongoose;

const gradeSchema = new mongoose.Schema({
  student:    { type: Schema.Types.ObjectId, ref: "Student", required: true },
  subject:    { type: String, required: true },
  term:       { type: String },
  week:       { type: Number },
  score:      { type: Number, required: true },
  totalScore: { type: Number, default: 20 },
  gradedBy:   { type: Schema.Types.ObjectId, ref: "Teacher" },
  remarks:    { type: String },
}, { timestamps: true });

const Grade = mongoose.model("Grade", gradeSchema);
export default Grade;

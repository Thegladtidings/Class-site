import mongoose from "mongoose";
const { Schema } = mongoose;

const submissionSchema = new mongoose.Schema({
  assignment:   { type: Schema.Types.ObjectId, ref: "Assignment", required: true },
  student:      { type: Schema.Types.ObjectId, ref: "Student", required: true },
  fileUrl:      { type: String },                       // uploaded answer file
  fileName:     { type: String },                       // original filename
  note:         { type: String },                       // optional text note from student
  submittedAt:  { type: Date, default: Date.now },
  status:       { type: String, enum: ["submitted", "late", "missing"], default: "submitted" },
  grade:        { type: Number, default: null },         // teacher can grade later
  teacherRemark:{ type: String, default: null },
}, { timestamps: true });

const Submission = mongoose.model("Submission", submissionSchema);
export default Submission;

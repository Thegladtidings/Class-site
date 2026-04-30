import mongoose from "mongoose";
const { Schema } = mongoose;

// Sub-schema for each question
const questionSchema = new Schema({
  question:      { type: String, required: true },
  options:       [{ type: String, required: true }],   // array of 4 options e.g. ["A. ...", "B. ..."]
  correctAnswer: { type: String, required: true },      // must match one of the options exactly
  mark:          { type: Number, default: 1 },          // marks awarded for correct answer
});

const examSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  subject:     { type: String, required: true },
  className:   { type: String, required: true },
  term:        { type: String },                         // e.g. "First Term"
  durationMins:{ type: Number, required: true },         // exam timer in minutes
  totalMarks:  { type: Number },                         // auto-computed or set manually
  questions:   [questionSchema],
  createdBy:   { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
  isPublished: { type: Boolean, default: false },         // teacher publishes when ready
  startTime:   { type: Date, default: null },             // optional scheduled start
  endTime:     { type: Date, default: null },             // optional deadline
}, { timestamps: true });

// Auto-compute totalMarks before save
examSchema.pre("save", function () {
  if (this.questions?.length) {
    this.totalMarks = this.questions.reduce((sum, q) => sum + (q.mark || 1), 0);
  }
});

const Exam = mongoose.model("Exam", examSchema);
export default Exam;

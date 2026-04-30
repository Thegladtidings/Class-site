import mongoose from "mongoose";
const { Schema } = mongoose;

const answerSchema = new Schema({
  questionId:    { type: Schema.Types.ObjectId, required: true },
  selectedOption: { type: String },    // what the student chose
  isCorrect:     { type: Boolean },
});

const examResultSchema = new mongoose.Schema({
  exam:          { type: Schema.Types.ObjectId, ref: "Exam", required: true },
  student:       { type: Schema.Types.ObjectId, ref: "Student", required: true },
  answers:       [answerSchema],
  score:         { type: Number, default: 0 },
  totalMarks:    { type: Number },
  percentage:    { type: Number },
  timeTakenMins: { type: Number },      // how long they actually spent
  submittedAt:   { type: Date, default: Date.now },
  status:        { type: String, enum: ["completed", "timed_out", "abandoned"], default: "completed" },
}, { timestamps: true });

// Prevent a student from submitting the same exam twice
examResultSchema.index({ exam: 1, student: 1 }, { unique: true });

const ExamResult = mongoose.model("ExamResult", examResultSchema);
export default ExamResult;

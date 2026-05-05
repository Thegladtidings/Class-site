import mongoose from "mongoose";
const { Schema } = mongoose;

const answerSchema = new Schema({
  questionId:     { type: Schema.Types.ObjectId, required: true },
  selectedOption: { type: String },
  isCorrect:      { type: Boolean },
}, { _id: false });

// Stores each student's unique shuffled snapshot at exam-start time.
// Grading reads from here — not the master exam — so shuffled options
// never cause wrong grades even if the teacher edits the exam later.
const personalizedQuestionSchema = new Schema({
  _id:           { type: Schema.Types.ObjectId },
  question:      { type: String, required: true },
  options:       { type: [String], required: true },
  correctAnswer: { type: String, required: true }, // answer TEXT, not index
  mark:          { type: Number, default: 1 },
}, { _id: false });

const examResultSchema = new Schema({
  exam:    { type: Schema.Types.ObjectId, ref: "Exam",    required: true },
  student: { type: Schema.Types.ObjectId, ref: "Student", required: true },

  // ── Personalized snapshot ──────────────────────────────────────────────────
  // Saved when the student hits "Start Exam". Contains their unique question
  // order + shuffled options + correct answers (never sent to the client).
  personalizedQuestions: { type: [personalizedQuestionSchema], default: [] },

  // ── Grading ───────────────────────────────────────────────────────────────
  answers:       { type: [answerSchema], default: [] },
  score:         { type: Number, default: 0 },
  totalMarks:    { type: Number },
  percentage:    { type: Number },
  timeTakenMins: { type: Number },

  // ── State ─────────────────────────────────────────────────────────────────
  // "in-progress" is the initial state when startExam creates the doc.
  // The controller updates this to "completed" | "timed_out" | "abandoned"
  // when the student submits.
  submitted:   { type: Boolean, default: false },
  startedAt:   { type: Date,    default: Date.now },
  submittedAt: { type: Date },
  status: {
    type:    String,
    enum:    ["in-progress", "completed", "timed_out", "abandoned"],
    default: "in-progress",
  },

}, { timestamps: true });

// One result document per student per exam
examResultSchema.index({ exam: 1, student: 1 }, { unique: true });

const ExamResult = mongoose.model("ExamResult", examResultSchema);
export default ExamResult;
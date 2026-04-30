import Exam from "../models/exam.js";
import ExamResult from "../models/examResult.js";
import Student from "../models/student.js";

// ─── TEACHER: Create a CBT exam ───────────────────────────────────────────────
export const createExam = async (req, res) => {
  try {
    const { title, subject, className, term, durationMins, questions, startTime, endTime } = req.body;

    if (!questions || questions.length === 0)
      return res.status(400).json({ message: "Exam must have at least one question" });

    const exam = await Exam.create({
      title, subject, className, term, durationMins, questions,
      startTime, endTime,
      createdBy: req.user.id,
      isPublished: false,
    });

    res.status(201).json({ message: "Exam created successfully", exam });
  } catch (err) {
    res.status(500).json({ message: "Error creating exam", error: err.message });
  }
};

// ─── TEACHER: Publish / unpublish an exam ─────────────────────────────────────
export const togglePublishExam = async (req, res) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.examId, createdBy: req.user.id });
    if (!exam) return res.status(404).json({ message: "Exam not found or not yours" });

    exam.isPublished = !exam.isPublished;
    await exam.save();

    res.json({ message: `Exam ${exam.isPublished ? "published" : "unpublished"}`, exam });
  } catch (err) {
    res.status(500).json({ message: "Error updating exam", error: err.message });
  }
};

// ─── TEACHER: Get all their exams ─────────────────────────────────────────────
export const getTeacherExams = async (req, res) => {
  try {
    const exams = await Exam.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    res.json({ exams });
  } catch (err) {
    res.status(500).json({ message: "Error fetching exams", error: err.message });
  }
};

// ─── TEACHER: Get results for an exam ─────────────────────────────────────────
export const getExamResults = async (req, res) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.examId, createdBy: req.user.id });
    if (!exam) return res.status(404).json({ message: "Exam not found or not yours" });

    const results = await ExamResult.find({ exam: req.params.examId })
      .populate("student", "name email className studentId")
      .sort({ score: -1 });

    res.json({ exam, results });
  } catch (err) {
    res.status(500).json({ message: "Error fetching results", error: err.message });
  }
};

// ─── TEACHER: Update/edit an exam (only if not yet published) ─────────────────
export const updateExam = async (req, res) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.examId, createdBy: req.user.id });
    if (!exam) return res.status(404).json({ message: "Exam not found or not yours" });
    if (exam.isPublished)
      return res.status(400).json({ message: "Cannot edit a published exam. Unpublish it first." });

    Object.assign(exam, req.body);
    await exam.save();
    res.json({ message: "Exam updated", exam });
  } catch (err) {
    res.status(500).json({ message: "Error updating exam", error: err.message });
  }
};

// ─── TEACHER: Delete an exam ──────────────────────────────────────────────────
export const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findOneAndDelete({ _id: req.params.examId, createdBy: req.user.id });
    if (!exam) return res.status(404).json({ message: "Exam not found or not yours" });
    res.json({ message: "Exam deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting exam", error: err.message });
  }
};

// ─── STUDENT: Get available published exams for their class ───────────────────
export const getAvailableExams = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const now = new Date();
    const exams = await Exam.find({
      className: student.className,
      isPublished: true,
      $or: [{ endTime: null }, { endTime: { $gte: now } }],
    })
.select("title subject className durationMins totalMarks createdBy startTime endTime")
      .sort({ createdAt: -1 });

    // Mark which exams the student has already taken
    const takenExamIds = (
      await ExamResult.find({ student: req.user.id }).select("exam")
    ).map((r) => String(r.exam));

    const examsWithStatus = exams.map((e) => ({
      ...e.toObject(),
      alreadyTaken: takenExamIds.includes(String(e._id)),
    }));

    res.json({ exams: examsWithStatus });
  } catch (err) {
    res.status(500).json({ message: "Error fetching exams", error: err.message });
  }
};

// ─── STUDENT: Start exam — returns questions without correct answers ───────────
export const startExam = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    const now = new Date();

    const exam = await Exam.findOne({
      _id: req.params.examId,
      className: student.className,
      isPublished: true,
      $or: [{ endTime: null }, { endTime: { $gte: now } }],
    }).select("-questions.correctAnswer");

    if (!exam) return res.status(404).json({ message: "Exam not available" });

    // Check if already taken
    const alreadyTaken = await ExamResult.findOne({ exam: exam._id, student: req.user.id });
    if (alreadyTaken)
      return res.status(400).json({ message: "You have already taken this exam" });

    res.json({
      message: "Exam started. Timer begins now.",
      exam,
      serverTime: now,                          // frontend uses this to sync countdown
    });
  } catch (err) {
    res.status(500).json({ message: "Error starting exam", error: err.message });
  }
};

// ─── STUDENT: Submit exam answers ─────────────────────────────────────────────
export const submitExam = async (req, res) => {
  try {
    const { answers, timeTakenMins, status } = req.body;
    // answers: [{ questionId, selectedOption }]

    const alreadySubmitted = await ExamResult.findOne({
      exam: req.params.examId,
      student: req.user.id,
    });
    if (alreadySubmitted)
      return res.status(400).json({ message: "You have already submitted this exam" });

    const exam = await Exam.findById(req.params.examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    // Auto-grade
    let score = 0;
    const gradedAnswers = (answers || []).map((ans) => {
      const question = exam.questions.id(ans.questionId);
      const isCorrect = question && question.correctAnswer === ans.selectedOption;
      if (isCorrect) score += question.mark || 1;
      return { questionId: ans.questionId, selectedOption: ans.selectedOption, isCorrect: !!isCorrect };
    });

    const percentage = exam.totalMarks
      ? Math.round((score / exam.totalMarks) * 100)
      : 0;

    const result = await ExamResult.create({
      exam: exam._id,
      student: req.user.id,
      answers: gradedAnswers,
      score,
      totalMarks: exam.totalMarks,
      percentage,
      timeTakenMins,
      status: status || "completed",
    });

    res.status(201).json({
      message: "Exam submitted successfully",
      score,
      totalMarks: exam.totalMarks,
      percentage,
      result,
    });
  } catch (err) {
    res.status(500).json({ message: "Error submitting exam", error: err.message });
  }
};

// ─── STUDENT: Get their own exam results ──────────────────────────────────────
export const getMyExamResults = async (req, res) => {
  try {
    const results = await ExamResult.find({ student: req.user.id })
      .populate("exam", "title subject className durationMins totalMarks")
      .sort({ createdAt: -1 });
    res.json({ results });
  } catch (err) {
    res.status(500).json({ message: "Error fetching your results", error: err.message });
  }
};

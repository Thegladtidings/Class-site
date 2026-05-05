import Exam from "../models/exam.js";
import ExamResult from "../models/examResult.js";
import Student from "../models/student.js";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Builds a personalized exam copy for one student:
 *  1. Randomly picks `count` questions from the pool (or all if count is null)
 *  2. Shuffles the options for each question
 *  3. Keeps correctAnswer as the answer TEXT so grading still works
 *     regardless of where the option ended up after shuffling
 */
function buildPersonalizedQuestions(questions, count) {
  const pool     = shuffleArray(questions);           // shuffle question order
  const selected = count ? pool.slice(0, count) : pool;

  return selected.map((q) => {
    const shuffledOptions = shuffleArray([...q.options]);
    return {
      _id:           q._id,          // keep original _id for result linking
      question:      q.question,
      options:       shuffledOptions,
      correctAnswer: q.correctAnswer, // still the answer TEXT, now at a new index
      mark:          q.mark ?? 1,
      imageUrl:      q.imageUrl ?? null, // NEW

    };
  });
}

// ─── TEACHER: Create a CBT exam ───────────────────────────────────────────────
export const createExam = async (req, res) => {
  try {
    const {
      title, subject, className, term,
      durationMins, questions, startTime, endTime,
      questionsPerStudent,   // NEW — e.g. 40 (pick 40 from a larger pool)
    } = req.body;

    if (!questions || questions.length === 0)
      return res.status(400).json({ message: "Exam must have at least one question" });

    if (questionsPerStudent && questionsPerStudent > questions.length)
      return res.status(400).json({
        message: `questionsPerStudent (${questionsPerStudent}) cannot exceed the pool size (${questions.length}).`,
      });

    const exam = await Exam.create({
      title, subject, className, term, durationMins, questions,
      startTime, endTime,
      questionsPerStudent: questionsPerStudent || null,
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

// ─── TEACHER: Update/edit an exam ─────────────────────────────────────────────
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

// controllers/uploadController.js  (or add to your existing upload controller)
export const uploadQuestionImage = async (req, res) => {
  try {
    console.log("Received file for upload:", req.file?.originalname);
    if (!req.file)
      return res.status(400).json({ message: "No file provided" });

    // Stream the buffer straight to Cloudinary — no disk write needed
    const streamUpload = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "exam-questions", resource_type: "image" },
          (error, result) => (error ? reject(error) : resolve(result))
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

    const result = await streamUpload();
    res.json({ url: result.secure_url });
  } catch (err) {
    res.status(500).json({ message: "Image upload failed", error: err.message });
  }
};

// ─── STUDENT: Get available published exams for their class ───────────────────
export const getAvailableExams = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const now = new Date();
    const exams = await Exam.find({
      className:   student.className,
      isPublished: true,
      $or: [{ endTime: null }, { endTime: { $gte: now } }],
    })
      .select("title subject className durationMins totalMarks questionsPerStudent createdBy startTime endTime")
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

// ─── STUDENT: Start exam ──────────────────────────────────────────────────────
// Each student gets a unique shuffled copy of the questions and options.
// Their personalized snapshot is stored in ExamResult so grading is accurate.
export const startExam = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const now  = new Date();
    const exam = await Exam.findOne({
      _id:         req.params.examId,
      className:   student.className,
      isPublished: true,
      startTime:   { $lte: now },          // exam must have started
      $or: [{ endTime: null }, { endTime: { $gte: now } }],
    });

    if (!exam) return res.status(404).json({ message: "Exam not available" });

    // If student already started (but not submitted), return their saved snapshot
    const existingResult = await ExamResult.findOne({
      exam:    exam._id,
      student: req.user.id,
    });

    if (existingResult) {
      if (existingResult.submitted)
        return res.status(400).json({ message: "You have already submitted this exam" });

      // Return their in-progress snapshot — strip correctAnswer before sending
      const questionsForClient = existingResult.personalizedQuestions.map(
        ({ _id, question, options ,imageUrl}) => ({ _id, question, options, imageUrl })
      );

      return res.json({
        message:      "Resuming exam.",
        examResultId: existingResult._id,
        durationMins: exam.durationMins,
        startedAt:    existingResult.startedAt,
        serverTime:   now,
        questions:    questionsForClient,
      });
    }

    // ── Build this student's unique personalized copy ──────────────────────
    const personalizedQuestions = buildPersonalizedQuestions(
      exam.questions,
      exam.questionsPerStudent   // null = give all questions
    );

    // Save an in-progress ExamResult that stores the snapshot for grading later
    const result = await ExamResult.create({
      exam:                   exam._id,
      student:                req.user.id,
      personalizedQuestions,  // stored with correctAnswers for server-side grading
      answers:                [],
      submitted:              false,
      startedAt:              now,
    });

    // Strip correctAnswer before sending to client
    const questionsForClient = personalizedQuestions.map(
      ({ _id, question, options, imageUrl }) => ({ _id, question, options, imageUrl })
    );

    res.status(201).json({
      message:      "Exam started. Timer begins now.",
      examResultId: result._id,
      durationMins: exam.durationMins,
      startedAt:    now,
      serverTime:   now,
      questions:    questionsForClient,
    });
  } catch (err) {
    res.status(500).json({ message: "Error starting exam", error: err.message });
  }
};

// ─── STUDENT: Submit exam answers ─────────────────────────────────────────────
// answers: [{ questionId, selectedOption }]
// Graded against the student's OWN personalizedQuestions snapshot,
// so shuffled options never cause wrong grades.
export const submitExam = async (req, res) => {
  try {
    const { answers, timeTakenMins, status } = req.body;

    const result = await ExamResult.findOne({
      exam:    req.params.examId,
      student: req.user.id,
    });

    if (!result)
      return res.status(404).json({ message: "Exam session not found. Did you start the exam?" });
    if (result.submitted)
      return res.status(400).json({ message: "You have already submitted this exam" });

    // Build a quick lookup: originalQuestionId → correctAnswer
    // Uses the snapshot stored at start time — works even if teacher edits later
    const correctAnswerMap = {};
    result.personalizedQuestions.forEach((q) => {
      correctAnswerMap[String(q._id)] = q.correctAnswer;
    });

    // Grade
    let score = 0;
    const gradedAnswers = (answers || []).map((ans) => {
      const correctAnswer = correctAnswerMap[String(ans.questionId)];
      const isCorrect     = !!correctAnswer && correctAnswer === ans.selectedOption;
      if (isCorrect) score++;
      return {
        questionId:     ans.questionId,
        selectedOption: ans.selectedOption,
        isCorrect,
      };
    });

    const totalMarks = result.personalizedQuestions.length;
    const percentage = totalMarks ? Math.round((score / totalMarks) * 100) : 0;

    result.answers       = gradedAnswers;
    result.score         = score;
    result.totalMarks    = totalMarks;
    result.percentage    = percentage;
    result.timeTakenMins = timeTakenMins;
    result.submitted     = true;
    result.submittedAt   = new Date();
    result.status        = status || "completed";
    await result.save();

    res.status(201).json({
      message: "Exam submitted successfully",
      score,
      totalMarks,
      percentage,
      timeTakenMins,
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
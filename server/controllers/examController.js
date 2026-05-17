import Exam from "../models/exam.js";
import ExamResult from "../models/examResult.js";
import Student from "../models/student.js";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import { v4 as uuidv4 } from "uuid"; // npm i uuid  (already a common dep — add if missing)

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
  const pool     = shuffleArray(questions);
  const selected = count ? pool.slice(0, count) : pool;

  return selected.map((q) => ({
    _id:           q._id,
    question:      q.question,
    options:       shuffleArray([...q.options]),
    correctAnswer: q.correctAnswer, // answer TEXT — survives option shuffle
    mark:          q.mark ?? 1,
    imageUrl:      q.imageUrl ?? null,
  }));
}

/**
 * Strip correctAnswer before sending questions to the client.
 * Never expose answers to the browser.
 */
function questionsForClient(personalizedQuestions) {
  return personalizedQuestions.map(({ _id, question, options, imageUrl }) => ({
    _id,
    question,
    options,
    imageUrl,
  }));
}

// ─── TEACHER: Create a CBT exam ───────────────────────────────────────────────
export const createExam = async (req, res) => {
  try {
    const {
      title, subject, className, term,
      durationMins, questions, startTime, endTime, allowedStudents,
      questionsPerStudent,
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
      allowedStudents: allowedStudents || [],
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

export const getStudentsByClass = async (req, res) => {
  try {
    const { className } = req.params;
    const students = await Student.find({ className })
      .select("name studentId profileImage className")
      .sort({ name: 1 });
    res.json({ students });
  } catch (err) {
    res.status(500).json({ message: "Error fetching students", error: err.message });
  }
};

export const resetStudentResult = async (req, res) => {
  try {
    const { examId, studentId } = req.params;

    const exam = await Exam.findOne({ _id: examId, createdBy: req.user.id });
    if (!exam) return res.status(404).json({ message: "Exam not found or not yours" });

    const deleted = await ExamResult.findOneAndDelete({ exam: examId, student: studentId });
    if (!deleted) return res.status(404).json({ message: "No result found for this student" });

    res.json({ message: "Result reset. Student can now retake the exam." });
  } catch (err) {
    res.status(500).json({ message: "Error resetting result", error: err.message });
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

// ─── UPLOAD: Question image ───────────────────────────────────────────────────
export const uploadQuestionImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file provided" });

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
      $or: [{ startTime: null }, { startTime: { $lte: now } }],
      $and: [
        {
          $or: [
            { endTime: { $exists: false } },
            { endTime: null },
            { endTime: "" },
            { endTime: { $gte: now } },
          ],
        },
        {
          $or: [
            { allowedStudents: { $exists: false } },
            { allowedStudents: { $size: 0 } },
            { allowedStudents: { $elemMatch: { $eq: student._id } } },
          ],
        },
      ],
    })
      .select("title subject className durationMins totalMarks questionsPerStudent createdBy startTime endTime allowedStudents")
      .sort({ createdAt: -1 });

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

// ─── STUDENT: Verify an in-progress session ───────────────────────────────────
//
// GET /api/exam/session/:sessionToken
//
// Called by the frontend on page restore (refresh / app reopen on mobile)
// BEFORE showing the exam screen, to confirm the session still exists on the
// server. Returns 200 if valid, 404 if gone.
//
// Why this matters on mobile:
//   iOS Safari kills the JS context when the user locks the screen or switches
//   apps. On return, the page cold-boots and reads sessionToken from
//   localStorage. Without this check, the student would be dropped into an exam
//   whose startExam request may never have reached the server (slow 4G + kill).
//
export const verifySession = async (req, res) => {
  try {
    const result = await ExamResult.findOne({
      sessionToken: req.params.sessionToken,
      student:      req.user.id,
      submitted:    false,               // only valid if not yet submitted
    }).select("_id exam sessionToken startedAt");

    if (!result)
      return res.status(404).json({ message: "Session not found or already submitted" });

    res.json({
      valid:        true,
      examResultId: result._id,
      examId:       result.exam,
      startedAt:    result.startedAt,
    });
  } catch (err) {
    res.status(500).json({ message: "Error verifying session", error: err.message });
  }
};

// ─── STUDENT: Start exam ──────────────────────────────────────────────────────
//
// Changes from original:
//
// 1. IDEMPOTENT — if an in-progress ExamResult already exists for this student
//    + exam, we return the SAME sessionToken instead of erroring or creating a
//    duplicate. This makes double-taps and slow-network retries safe on mobile.
//
// 2. sessionToken — a UUID generated at session creation and stored on the
//    ExamResult document. The frontend uses this as the single source of truth
//    for session identity on submit, replacing the fragile examId+studentId
//    lookup which couldn't distinguish between multiple attempts.
//
// 3. startedAt — stored on the document and returned to the client so the
//    frontend can compute remaining time from the server-authoritative start
//    time rather than trusting its own clock (fixes timer drift after mobile
//    tab suspension).
//
// Required schema addition on ExamResult:
//   sessionToken: { type: String, index: true }
//   startedAt:    { type: Date }
//
export const startExam = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const now  = new Date();
    const exam = await Exam.findOne({
      _id:         req.params.examId,
      className:   student.className,
      isPublished: true,
      startTime:   { $lte: now },
      $or: [{ endTime: null }, { endTime: { $gte: now } }],
    });

    if (!exam) return res.status(404).json({ message: "Exam not available" });

    if (
      exam.allowedStudents.length > 0 &&
      !exam.allowedStudents.map(String).includes(String(student._id))
    ) {
      return res.status(403).json({ message: "You are not authorised to take this exam." });
    }

    // ── Check for an existing in-progress result ───────────────────────────
    const existingResult = await ExamResult.findOne({
      exam:    exam._id,
      student: req.user.id,
    });

    if (existingResult) {
      // Already fully submitted — block retake
      if (existingResult.submitted)
        return res.status(400).json({ message: "You have already submitted this exam" });

      // ── IDEMPOTENT RESUME ──────────────────────────────────────────────
      // In-progress session exists. Return the same sessionToken so the
      // frontend can restore seamlessly without creating a duplicate session.
      // This is the key fix for the mobile double-tap / slow-network race:
      // even if startExam is called twice, the second call returns the first
      // session's token rather than creating a conflicting record.

      return res.json({
        message:      "Resuming exam.",
        sessionToken: existingResult.sessionToken, // same token as before
        examResultId: existingResult._id,
        durationMins: exam.durationMins,
        startedAt:    existingResult.startedAt,
        serverTime:   now,
        exam: {
          _id:                exam._id,
          title:              exam.title,
          subject:            exam.subject,
          className:          exam.className,
          durationMins:       exam.durationMins,
          totalMarks:         exam.totalMarks,
          questionsPerStudent: exam.questionsPerStudent,
          startTime:          exam.startTime,
          endTime:            exam.endTime,
          questions:          questionsForClient(existingResult.personalizedQuestions),
        },
      });
    }

    // ── Brand-new session ──────────────────────────────────────────────────
    const personalizedQuestions = buildPersonalizedQuestions(
      exam.questions,
      exam.questionsPerStudent
    );

    // Generate a unique opaque token for this session.
    // The frontend stores this and sends it back on submit.
    // The backend uses ONLY this token to find the record — no more
    // exam+student compound lookup that can match multiple attempts.
    const sessionToken = uuidv4();

    const result = await ExamResult.create({
      exam:                  exam._id,
      student:               req.user.id,
      sessionToken,          // ← NEW: stored for submit + verify lookups
      personalizedQuestions, // stored with correctAnswers for server-side grading
      answers:               [],
      submitted:             false,
      startedAt:             now,  // ← server-authoritative start time
    });

    res.status(201).json({
      message:      "Exam started. Timer begins now.",
      sessionToken, // ← returned to frontend; saved to localStorage
      examResultId: result._id,
      durationMins: exam.durationMins,
      startedAt:    now,
      serverTime:   now,
      exam: {
        _id:                exam._id,
        title:              exam.title,
        subject:            exam.subject,
        className:          exam.className,
        durationMins:       exam.durationMins,
        totalMarks:         exam.totalMarks,
        questionsPerStudent: exam.questionsPerStudent,
        startTime:          exam.startTime,
        endTime:            exam.endTime,
        questions:          questionsForClient(personalizedQuestions),
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Error starting exam", error: err.message });
  }
};

// ─── STUDENT: Submit exam answers ─────────────────────────────────────────────
//
// Changes from original:
//
// 1. PRIMARY LOOKUP is now by sessionToken — the opaque UUID stored in
//    localStorage and sent in the request body. This is unambiguous: one token
//    = one session. The old lookup (exam + student) could fail on mobile when:
//      a) startExam created the record but the response never reached the client
//      b) the client retried startExam and got a 400 "already submitted" error
//         because it found the first record — leaving the student with no valid
//         session to submit against.
//
// 2. FALLBACK LOOKUP by exam + student is kept for backwards compatibility
//    during the rollout period (clients that don't have sessionToken yet).
//    Remove the fallback once all active clients are on the new frontend.
//
export const submitExam = async (req, res) => {
  try {
    const { answers, timeTakenMins, status, sessionToken } = req.body;

    // ── Primary: look up by sessionToken ──────────────────────────────────
    // This is the reliable path. One token = one unambiguous session.
    let result = sessionToken
      ? await ExamResult.findOne({
          sessionToken,
          student:   req.user.id,  // ownership check — token alone isn't enough
          submitted: false,
        })
      : null;

    // ── Fallback: look up by exam + student (old clients) ─────────────────
    // Remove this block once all clients send sessionToken.
    if (!result) {
      result = await ExamResult.findOne({
        exam:      req.params.examId,
        student:   req.user.id,
        submitted: false,
      });
    }

    if (!result)
      return res.status(404).json({
        message: "Exam session not found. Did you start the exam?",
      });

    // Double-submit guard (shouldn't reach here because submitted:false is in
    // the query, but kept as a belt-and-suspenders check)
    if (result.submitted)
      return res.status(400).json({ message: "You have already submitted this exam" });

    // ── Grade against the student's personalizedQuestions snapshot ─────────
    // Uses the snapshot stored at start time — correct even if teacher edits
    // the exam pool after some students have started.
    const correctAnswerMap = {};
    result.personalizedQuestions.forEach((q) => {
      correctAnswerMap[String(q._id)] = q.correctAnswer;
    });

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
      result: {
        answers:     gradedAnswers,
        timeTakenMins,
      },
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

// ─── STUDENT: Get upcoming exams ──────────────────────────────────────────────
export const getUpcomingExams = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const now = new Date();

    const exams = await Exam.find({
      className:   student.className,
      isPublished: true,
      startTime:   { $gt: now },
      $and: [
        {
          $or: [
            { endTime: { $exists: false } },
            { endTime: null },
            { endTime: { $gte: now } },
          ],
        },
        {
          $or: [
            { allowedStudents: { $exists: false } },
            { allowedStudents: { $size: 0 } },
            { allowedStudents: { $elemMatch: { $eq: student._id } } },
          ],
        },
      ],
    })
      .select("title subject className durationMins questionsPerStudent startTime endTime allowedStudents")
      .sort({ startTime: 1 });

    res.json({ exams });
  } catch (err) {
    res.status(500).json({ message: "Error fetching upcoming exams", error: err.message });
  }
};


import { Router } from "express";
import { protect, authorise } from "../middleware/authmiddleware.js";
import {
  createExam,
  togglePublishExam,
  getTeacherExams,
  getExamResults,
  updateExam,
  deleteExam,
  getAvailableExams,
  startExam,
  submitExam,
  getMyExamResults,
  uploadQuestionImage,
  getStudentsByClass,
  resetStudentResult,
  debugExamQuery,
  getUpcomingExams
} from "../controllers/examController.js";
// In your routes file
import multer from "multer";


// Auth middleware keeps this teacher-only
const router = Router();

const upload = multer({ storage: multer.memoryStorage() });
// ── Teacher routes ──────────────────────────────────────────────────────────
router.post("/teacher/upload-image", protect, upload.single("image"), uploadQuestionImage);
router.post("/teacher",                        protect, authorise("teacher"), createExam);
router.get("/teacher/my",                       protect, authorise("teacher"), getTeacherExams);
router.patch("/teacher/:examId/publish",        protect, authorise("teacher"), togglePublishExam);
router.patch("/teacher/:examId",                protect, authorise("teacher"), updateExam);
router.delete("/teacher/:examId",              protect, authorise("teacher"), deleteExam);
router.get("/teacher/:examId/results",          protect, authorise("teacher"), getExamResults);
// Add these two new routes
router.get("/teacher/students/:className",           protect, authorise("teacher"), getStudentsByClass);
router.delete("/teacher/:examId/results/:studentId", protect, authorise("teacher"), resetStudentResult);
// ── Student routes ──────────────────────────────────────────────────────────
router.get("/my-upcoming",              protect, authorise("student"), getUpcomingExams);
router.get("/",                         protect, authorise("student"), getAvailableExams);
router.get("/my-debug",                       protect, authorise("student"), debugExamQuery); // same endpoint, but frontend can use to show "My Exams"
router.get("/my-results",              protect, authorise("student"), getMyExamResults);
router.get("/:examId/start",           protect, authorise("student"), startExam);
router.post("/:examId/submit",         protect, authorise("student"), submitExam);

export default router;

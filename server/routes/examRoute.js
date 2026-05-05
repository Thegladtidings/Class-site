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
  uploadQuestionImage
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

// ── Student routes ──────────────────────────────────────────────────────────
router.get("/",                         protect, authorise("student"), getAvailableExams);
router.get("/my-results",              protect, authorise("student"), getMyExamResults);
router.get("/:examId/start",           protect, authorise("student"), startExam);
router.post("/:examId/submit",         protect, authorise("student"), submitExam);

export default router;

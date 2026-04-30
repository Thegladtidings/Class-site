import { Router } from "express";
import { protect, authorise } from "../middleware/authmiddleware.js";
import {
  createAssignment,
  getTeacherAssignments,
  getSubmissionsForAssignment,
  gradeSubmission,
  deleteAssignment,
  getAssignmentsForStudent,
  submitAssignment,
  getMySubmissions,
} from "../controllers/assignmentController.js";

const router = Router();

// ── Teacher routes ──────────────────────────────────────────────────────────
router.post("/",            protect, authorise("teacher"), createAssignment);
router.get("/my",           protect, authorise("teacher"), getTeacherAssignments);
router.get("/:assignmentId/submissions", protect, authorise("teacher"), getSubmissionsForAssignment);
router.patch("/submissions/:submissionId/grade", protect, authorise("teacher"), gradeSubmission);
router.delete("/:assignmentId", protect, authorise("teacher"), deleteAssignment);

// ── Student routes ──────────────────────────────────────────────────────────
router.get("/",             protect, authorise("student"), getAssignmentsForStudent);
router.post("/:assignmentId/submit", protect, authorise("student"), submitAssignment);
router.get("/my-submissions", protect, authorise("student"), getMySubmissions);

export default router;

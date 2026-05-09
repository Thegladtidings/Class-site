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
  unsubmitAssignment,
  updateAssignment
} from "../controllers/assignmentController.js";
import { upload } from "../middleware/upload.js";

const router = Router();

// ── Teacher routes ──────────────────────────────────────────────────────────
router.post("/",            protect, authorise("teacher"), createAssignment);
router.get("/my",           protect, authorise("teacher"), getTeacherAssignments);
router.patch("/:id", protect, authorise("teacher"), updateAssignment);
router.get("/:assignmentId/submissions", protect, authorise("teacher"), getSubmissionsForAssignment);
router.patch("/submissions/:submissionId/grade", protect, authorise("teacher"), gradeSubmission);
router.delete("/:assignmentId", protect, authorise("teacher"), deleteAssignment);

// ── Student routes ──────────────────────────────────────────────────────────
router.get("/student",             protect, authorise("student"), getAssignmentsForStudent);
router.post(  "/submit/:assignmentId",protect, authorise("student"), upload.single("file"), submitAssignment);
router.get("/my-submissions", protect, authorise("student"), getMySubmissions);
router.delete("/unsubmit/:assignmentId", protect, unsubmitAssignment);

export default router;


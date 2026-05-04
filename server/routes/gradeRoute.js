import express from "express";
import {
  getStudentsByClass,
  getTeacherGrades,
  createGrade,
  updateGrade,
  deleteGrade,
  getMyGrades,
} from "../controllers/gradeController.js";
import { protect, authorise } from "../middleware/authmiddleware.js";

const router = express.Router();

/* ── Teacher routes ── */
router.get(   "/students",         protect, authorise("teacher"), getStudentsByClass);
router.get(   "/teacher",          protect, authorise("teacher"), getTeacherGrades);
router.post(  "/teacher",          protect, authorise("teacher"), createGrade);
router.patch( "/teacher/:gradeId", protect, authorise("teacher"), updateGrade);
router.delete("/teacher/:gradeId", protect, authorise("teacher"), deleteGrade);

/* ── Student routes ── */
router.get("/student/me", protect, authorise("student"), getMyGrades);

export default router;
import { Router } from "express";
import { protect, authorise } from "../middleware/authmiddleware.js";
import {
  studentLogin,
  registerStudent,
  updateStudentProfile,
  getAllStudents,
} from "../controllers/studentController.js";

const router = Router();

router.post("/register", registerStudent);
router.post("/login", studentLogin);
router.patch("/profile", protect, authorise("student"), updateStudentProfile);

// Teacher/admin can see all students
router.get("/", protect, authorise("teacher", "admin"), getAllStudents);

export default router;

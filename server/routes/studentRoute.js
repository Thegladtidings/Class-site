import { Router } from "express";
import { protect, authorise } from "../middleware/authmiddleware.js";
import {
  studentLogin,
  registerStudent,
  updateStudentProfile,
  getAllStudents,
  getStudentProfile
} from "../controllers/studentController.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.post("/register", registerStudent);
router.post("/login", studentLogin);
router.patch("/profile-update", protect, authorise("student"), upload.single("profileImage"), updateStudentProfile);
router.get("/profile", protect, authorise("student"), getStudentProfile);
// Teacher/admin can see all students
router.get("/", protect, authorise("teacher", "admin"), getAllStudents);

export default router;

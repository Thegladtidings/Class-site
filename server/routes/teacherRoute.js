import { Router } from "express";
import { protect, authorise } from "../middleware/authmiddleware.js";
import {
  registerTeacher,
  teacherLogin,
  getTeacherProfile,
  getStudentById,
  updateTeacherProfile
} from "../controllers/teacherController.js";

const router = Router();

router.post("/register", registerTeacher);
router.post("/login", teacherLogin);
router.get("/profile", protect, authorise("teacher"), getTeacherProfile);
router.get("/students/:id", protect, authorise("teacher"), getStudentById);
router.put("/profile-update", protect, authorise("teacher"), updateTeacherProfile);
export default router;

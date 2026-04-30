import { Router } from "express";
import { protect, authorise } from "../middleware/authmiddleware.js";
import {
  registerTeacher,
  teacherLogin,
  getTeacherProfile,
} from "../controllers/teacherController.js";

const router = Router();

router.post("/register", registerTeacher);
router.post("/login", teacherLogin);
router.get("/profile", protect, authorise("teacher"), getTeacherProfile);

export default router;

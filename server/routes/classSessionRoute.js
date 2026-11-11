import { Router } from "express";
import { protect, authorise } from "../middleware/authmiddleware.js";
import {
  cancelClassSession,
  createClassSession,
  getClassSessions,
  updateClassSession,
} from "../controllers/classSessionController.js";

const router = Router();

router.get("/", protect, authorise("teacher", "student"), getClassSessions);
router.post("/", protect, authorise("teacher"), createClassSession);
router.patch("/:sessionId", protect, authorise("teacher"), updateClassSession);
router.delete("/:sessionId", protect, authorise("teacher"), cancelClassSession);

export default router;

// routes/subjectRoutes.js
import express from "express";
import {
  getAllSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  seedSubjects,
} from "../controllers/subjectController.js";

// Swap these in for your real auth / role middlewares:
 import { protect }   from "../middleware/authmiddleware.js";

const router = express.Router();

// ── Public / teacher routes ───────────────────────────────────
router.get("/",        protect, getAllSubjects);   // any page fetches subjects here

// ── Admin-only routes ─────────────────────────────────────────
router.post("/",        protect, createSubject);
router.patch("/:id",    protect,  updateSubject);
router.delete("/:id",   protect,  deleteSubject);

// ── One-time seed (remove or gate in production) ──────────────

export default router;
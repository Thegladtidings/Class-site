import {Router} from "express";
import { postAnnouncement, getAnnouncements , deleteAnnouncement} from "../controllers/announcementController.js";
import { protect } from "../middleware/authmiddleware.js";

const router = Router();

// ── POST announcement ────────────────────────────────────────────────────────
router.post('/', protect, postAnnouncement);
// ── GET all announcements by teacher ────────────────────────────────────────
router.get('/', protect, getAnnouncements);
// ── DELETE announcement ──────────────────────────────────────────────────────
router.delete('/:announcementId', protect, deleteAnnouncement);

export default router;
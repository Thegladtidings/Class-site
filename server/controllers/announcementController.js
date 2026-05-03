import Announcement from "../models/announcement.js";

// ─── POST announcement ────────────────────────────────────────────────────────
export const postAnnouncement = async (req, res) => {
  try {
    const { title, message, type, studentName, studentPhoto } = req.body;

    if (!title || !message)
      return res.status(400).json({ message: "Title and message are required" });

    const announcement = await Announcement.create({
      title,
      message,
      type:         type || "notice",
      studentName:  studentName  || null,
      studentPhoto: studentPhoto || null,
      postedBy:     req.user.id,
    });

    res.status(201).json({ message: "Announcement posted", announcement });
  } catch (err) {
    res.status(500).json({ message: "Error posting announcement", error: err.message });
  }
};

// ─── GET all announcements by teacher ────────────────────────────────────────
export const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .sort({ createdAt: -1 });
    res.json({ announcements });
  } catch (err) {
    res.status(500).json({ message: "Error fetching announcements", error: err.message });
  }
};

// ─── DELETE announcement ──────────────────────────────────────────────────────
export const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findOneAndDelete({
      _id: req.params.announcementId,
      postedBy: req.user.id,
    });
    if (!announcement)
      return res.status(404).json({ message: "Announcement not found or not yours" });

    res.json({ message: "Announcement deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting announcement", error: err.message });
  }
};
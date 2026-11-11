import mongoose from "mongoose";
import ClassSession from "../models/classSession.js";
import Student from "../models/student.js";

const parseSchedule = ({ subject, startsAt, durationMinutes, notes }) => {
  const parsedStart = new Date(startsAt);
  const duration = Number(durationMinutes);
  const cleanSubject = typeof subject === "string" ? subject.trim() : "";
  const cleanNotes = typeof notes === "string" ? notes.trim() : "";

  if (!cleanSubject || cleanSubject.length > 120) {
    return { error: "Subject is required and must be 120 characters or fewer." };
  }
  if (!startsAt || Number.isNaN(parsedStart.getTime()) || parsedStart <= new Date()) {
    return { error: "Choose a valid date and time in the future." };
  }
  if (!Number.isInteger(duration) || duration < 15 || duration > 240) {
    return { error: "Class duration must be between 15 and 240 minutes." };
  }
  if (cleanNotes.length > 1000) {
    return { error: "Notes must be 1000 characters or fewer." };
  }

  return {
    startsAt: parsedStart,
    endsAt: new Date(parsedStart.getTime() + duration * 60 * 1000),
    durationMinutes: duration,
    subject: cleanSubject,
    notes: cleanNotes,
  };
};

const hasConflict = async ({ field, ownerId, startsAt, endsAt, excludeId }) => {
  const query = {
    [field]: ownerId,
    status: "scheduled",
    startsAt: { $lt: endsAt },
    endsAt: { $gt: startsAt },
  };

  if (excludeId) query._id = { $ne: excludeId };
  return ClassSession.exists(query);
};

export const getClassSessions = async (req, res) => {
  try {
    const ownerField = req.user.role === "teacher" ? "teacher" : "student";
    const sessions = await ClassSession.find({
      [ownerField]: req.user.id,
      startsAt: { $gte: new Date() },
    })
      .sort({ startsAt: 1 })
      .limit(100)
      .populate("student", "name email className")
      .populate("teacher", "name subject")
      .lean();

    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ message: "Error fetching class schedule", error: err.message });
  }
};

export const createClassSession = async (req, res) => {
  try {
    const { studentId } = req.body;
    if (!mongoose.isValidObjectId(studentId)) {
      return res.status(400).json({ message: "Select a valid student." });
    }

    const schedule = parseSchedule(req.body);
    if (schedule.error) return res.status(400).json({ message: schedule.error });

    const student = await Student.findOne({ _id: studentId, isActive: true }).select("_id");
    if (!student) return res.status(404).json({ message: "Active student not found." });

    const overlaps = await Promise.all([
      hasConflict({ field: "teacher", ownerId: req.user.id, ...schedule }),
      hasConflict({ field: "student", ownerId: studentId, ...schedule }),
    ]);

    if (overlaps.some(Boolean)) {
      return res.status(409).json({
        message: "This time overlaps another scheduled class for you or the student.",
      });
    }

    const session = await ClassSession.create({
      ...schedule,
      teacher: req.user.id,
      student: studentId,
    });

    res.status(201).json({ message: "Class scheduled successfully.", session });
  } catch (err) {
    res.status(500).json({ message: "Error scheduling class", error: err.message });
  }
};

export const updateClassSession = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.sessionId)) {
      return res.status(400).json({ message: "Invalid class session." });
    }

    const session = await ClassSession.findOne({
      _id: req.params.sessionId,
      teacher: req.user.id,
    });
    if (!session) return res.status(404).json({ message: "Class session not found." });

    const schedule = parseSchedule(req.body);
    if (schedule.error) return res.status(400).json({ message: schedule.error });

    const overlaps = await Promise.all([
      hasConflict({
        field: "teacher",
        ownerId: req.user.id,
        ...schedule,
        excludeId: session._id,
      }),
      hasConflict({
        field: "student",
        ownerId: session.student,
        ...schedule,
        excludeId: session._id,
      }),
    ]);

    if (overlaps.some(Boolean)) {
      return res.status(409).json({
        message: "This time overlaps another scheduled class for you or the student.",
      });
    }

    Object.assign(session, schedule, { status: "scheduled" });
    await session.save();
    res.json({ message: "Class schedule updated.", session });
  } catch (err) {
    res.status(500).json({ message: "Error updating class schedule", error: err.message });
  }
};

export const cancelClassSession = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.sessionId)) {
      return res.status(400).json({ message: "Invalid class session." });
    }

    const session = await ClassSession.findOneAndUpdate(
      { _id: req.params.sessionId, teacher: req.user.id, status: "scheduled" },
      { status: "cancelled" },
      { new: true, runValidators: true }
    );

    if (!session) return res.status(404).json({ message: "Scheduled class not found." });
    res.json({ message: "Class cancelled.", session });
  } catch (err) {
    res.status(500).json({ message: "Error cancelling class", error: err.message });
  }
};

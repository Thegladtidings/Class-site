import Assignment from "../models/assignment.js";
import Submission from "../models/submission.js";

// Replace your existing makeDownloadUrl helper in assignmentController.js with this:

function makeDownloadUrl(url, mimetype = "") {
  if (!url) return url;
  const isPDF =
    mimetype === "application/pdf" ||
    url.toLowerCase().includes(".pdf");
  if (!isPDF) return url;

  // PDFs now upload as resource_type "raw", so the URL is:
  //   https://res.cloudinary.com/<cloud>/raw/upload/v.../file.pdf
  // fl_attachment on raw URLs works correctly and forces a download.
  return url.replace("/raw/upload/", "/raw/upload/fl_attachment/");
}
// ─── TEACHER: Create/upload an assignment ────────────────────────────────────
export const createAssignment = async (req, res) => {
  try {
    const {
      title,
      subject,
      description,
      dueDate,
      className,
      attachmentUrl,
      attachmentName,
      attachmentType,
    } = req.body;

    const assignment = await Assignment.create({
      title,
      subject,
      description,
      dueDate,
      className,
      attachmentUrl,
      attachmentName,
      attachmentType,
      postedBy: req.user.id,
    });

    res.status(201).json({ message: "Assignment created successfully", assignment });
  } catch (err) {
    res.status(500).json({ message: "Error creating assignment", error: err.message });
  }
};

// ─── TEACHER: Get all assignments they posted ─────────────────────────────────
export const getTeacherAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ postedBy: req.user.id }).sort({ createdAt: -1 });
    res.json({ assignments });
  } catch (err) {
    res.status(500).json({ message: "Error fetching assignments", error: err.message });
  }
};

// ─── TEACHER: Get all submissions for a specific assignment ───────────────────
export const getSubmissionsForAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findOne({ _id: assignmentId, postedBy: req.user.id });
    if (!assignment) return res.status(404).json({ message: "Assignment not found or not yours" });

    const submissions = await Submission.find({ assignment: assignmentId })
      .populate("student", "name email className studentId");

    res.json({ assignment, submissions });
  } catch (err) {
    res.status(500).json({ message: "Error fetching submissions", error: err.message });
  }
};

// ─── TEACHER: Grade a submission ─────────────────────────────────────────────
export const gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, teacherRemark } = req.body;
const parseGrade = Number(grade);
    if (isNaN(parseGrade) || parseGrade < 0) {
      return res.status(400).json({ message: "Grade must be a non-negative number" });
    }
    const submission = await Submission.findById(submissionId).populate("assignment");
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    if (String(submission.assignment.postedBy) !== String(req.user.id)) {
      return res.status(403).json({ message: "Not authorised to grade this submission" });
    }
    submission.grade = parseGrade;
    submission.teacherRemark = teacherRemark;
    submission.status = "graded";
    await submission.save();

    res.json({ message: "Submission graded", submission });
  } catch (err) {
    res.status(500).json({ message: "Error grading submission", error: err.message });
  }
};
// ─── TEACHER: Update an existing assignment ───────────────────────────────────
export const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    // Only the teacher who created it can edit it
    const assignment = await Assignment.findOne({ _id: id, postedBy: req.user.id });
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found or not yours" });
    }

    const {
      title,
      subject,
      description,
      dueDate,
      className,
      attachmentUrl,
      attachmentName,
      attachmentType,
    } = req.body;

    // Only overwrite fields that were actually sent
    if (title       !== undefined) assignment.title       = title;
    if (subject     !== undefined) assignment.subject     = subject;
    if (description !== undefined) assignment.description = description;
    if (dueDate     !== undefined) assignment.dueDate     = dueDate;
    if (className   !== undefined) assignment.className   = className;

    // Attachment: accept explicit null to clear, or a new value to replace
    if (attachmentUrl  !== undefined) assignment.attachmentUrl  = attachmentUrl  ?? null;
    if (attachmentName !== undefined) assignment.attachmentName = attachmentName ?? null;
    if (attachmentType !== undefined) assignment.attachmentType = attachmentType ?? null;

    await assignment.save();

    res.json({ message: "Assignment updated successfully", assignment });
  } catch (err) {
    res.status(500).json({ message: "Error updating assignment", error: err.message });
  }
};

// ─── TEACHER: Delete an assignment ───────────────────────────────────────────
export const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findOneAndDelete({
      _id: req.params.assignmentId,
      postedBy: req.user.id,
    });
    if (!assignment) return res.status(404).json({ message: "Assignment not found or not yours" });
    res.json({ message: "Assignment deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting assignment", error: err.message });
  }
};

// ─── STUDENT: View assignments for their class ────────────────────────────────
export const getAssignmentsForStudent = async (req, res) => {
  try {
    const { default: Student } = await import("../models/student.js");
    const student = await Student.findById(req.user.id);

    const assignments = await Assignment.find({
      className: student?.className,
      isActive: true,
    })
      .populate("postedBy", "name subject")
      .sort({ createdAt: -1 });

    res.json({ assignments });
  } catch (err) {
    res.status(500).json({ message: "Error fetching assignments", error: err.message });
  }
};

// ─── STUDENT: Submit an assignment ────────────────────────────────────────────
// - First submission: creates a new Submission document
// - Re-submission before deadline: updates the existing one (edit allowed)
// - Re-submission after deadline: blocked with 400
export const submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { note } = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment || !assignment.isActive) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const isLate = assignment.dueDate && new Date() > new Date(assignment.dueDate);

    // Build correct Cloudinary URL — PDFs get fl_attachment so they download
    // instead of opening a blank browser tab
    const rawUrl  = req.file.path;           // Cloudinary URL from multer-storage-cloudinary
    const fileUrl = makeDownloadUrl(rawUrl, req.file.mimetype);
    const fileName = req.file.originalname;

    const existing = await Submission.findOne({
      assignment: assignmentId,
      student: req.user.id,
    });

    // ── Edit after deadline → block ─────────────────────────────────────────
    if (existing && isLate) {
      return res.status(400).json({
        message: "The deadline has passed — you can no longer edit this submission.",
      });
    }

    // ── Edit before deadline → update ───────────────────────────────────────
    if (existing) {
      existing.fileUrl  = fileUrl;
      existing.fileName = fileName;
      existing.note     = note ?? existing.note;
      existing.status   = "submitted";
      await existing.save();

      return res.status(200).json({
        message: "Submission updated successfully",
        submission: existing,
      });
    }

    // ── Fresh submission ────────────────────────────────────────────────────
    const submission = await Submission.create({
      assignment: assignmentId,
      student: req.user.id,
      fileUrl,
      fileName,
      note,
      status: isLate ? "late" : "submitted",
    });

    res.status(201).json({
      message: isLate
        ? "Assignment submitted (marked as late)"
        : "Assignment submitted successfully",
      submission,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error submitting assignment",
      error: err.message,
    });
  }
};

// ─── STUDENT: View their own submissions ─────────────────────────────────────
export const getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user.id })
      .populate("assignment", "title subject dueDate className");
    res.json({ submissions });
  } catch (err) {
    res.status(500).json({ message: "Error fetching your submissions", error: err.message });
  }
};
// ─── STUDENT: Unsubmit an assignment ─────────────────────────────────────────
// Deletes the submission entirely so the assignment goes back to "pending".
// Only allowed before the deadline.
export const unsubmitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    // Block unsubmit after deadline
    const isLate = assignment.dueDate && new Date() > new Date(assignment.dueDate);
    if (isLate) {
      return res.status(400).json({
        message: "The deadline has passed — you can no longer unsubmit.",
      });
    }

    const deleted = await Submission.findOneAndDelete({
      assignment: assignmentId,
      student: req.user.id,
    });

    if (!deleted) {
      return res.status(404).json({ message: "No submission found to remove." });
    }

    res.json({ message: "Submission removed. Assignment is now pending." });
  } catch (err) {
    res.status(500).json({ message: "Error removing submission", error: err.message });
  }
};
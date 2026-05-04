import Assignment from "../models/assignment.js";
import Submission from "../models/submission.js";

// ─── TEACHER: Create/upload an assignment ────────────────────────────────────
export const createAssignment = async (req, res) => {
  try {
    const { title, subject, description, dueDate, className, attachmentUrl, attachmentName } = req.body;

    const assignment = await Assignment.create({
      title,
      subject,
      description,
      dueDate,
      className,
      attachmentUrl,    // URL from Cloudinary/S3 after frontend uploads the file
      attachmentName,
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

    // Confirm this assignment belongs to the requesting teacher
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
console.log("Grading submission:", submissionId, "with grade:", grade);
    const submission = await Submission.findById(submissionId).populate("assignment");
    if (!submission) return res.status(404).json({ message: "Submission not found" });
console.log("Found submission for assignment:", submission.assignment.title);
    // Ensure teacher owns the assignment
    if (String(submission.assignment.postedBy) !== String(req.user.id)) {
      return res.status(403).json({ message: "Not authorised to grade this submission" });
    }
console.log("Updating submission with grade and remark");
    submission.grade = grade;
    submission.teacherRemark = teacherRemark;
    console.log("Saving graded submission to database");
    await submission.save();
console.log("Submission graded successfully");
    res.json({ message: "Submission graded", submission });
  } catch (err) {
    res.status(500).json({ message: "Error grading submission", error: err.message });
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
    // req.user.id is the student; fetch className from DB
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
export const submitAssignment = async (req, res) => {
  try {

    const { assignmentId } = req.params;
    const { note } = req.body;
console.log("Received submission for assignment:", assignmentId, "with note:", note);
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment || !assignment.isActive) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const alreadySubmitted = await Submission.findOne({
      assignment: assignmentId,
      student: req.user.id,
    });

    if (alreadySubmitted) {
      return res.status(400).json({
        message: "You have already submitted this assignment",
      });
    }

    // ✅ Cloudinary file comes from req.file
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileUrl = req.file.path;   // Cloudinary URL
    const fileName = req.file.originalname;

    const isLate =
      assignment.dueDate && new Date() > new Date(assignment.dueDate);


      
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

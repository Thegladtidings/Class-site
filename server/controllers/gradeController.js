import Grade   from "../models/grade.js";
import Student from "../models/student.js";

/* ══════════════════════════════════════════════
   TEACHER — Get all students in a class
   GET /api/grades/students?className=JSS+2
══════════════════════════════════════════════ */
export const getStudentsByClass = async (req, res) => {
  try {
    const { className } = req.query;
    if (!className) return res.status(400).json({ message: "className is required" });

    const students = await Student.find({ className })
      .select("name studentId className")
      .sort({ name: 1 });

    res.json({ students });
  } catch (err) {
    res.status(500).json({ message: "Error fetching students", error: err.message });
  }
};

/* ══════════════════════════════════════════════
   TEACHER — Get all grades entered by this teacher
   GET /api/grades/teacher
   Optional filters: ?className=JSS+2&subject=Mathematics&term=First+Term
══════════════════════════════════════════════ */
export const getTeacherGrades = async (req, res) => {
  try {
    const { className, subject, term } = req.query;

    const filter = { gradedBy: req.user.id };
    if (subject) filter.subject = subject;
    if (term)    filter.term    = term;

    let grades = await Grade.find(filter)
      .populate("student", "name studentId className")
      .sort({ createdAt: -1 });

    // Filter by className after populate (className is on Student not Grade)
    if (className) {
      grades = grades.filter((g) => g.student?.className === className);
    }

    res.json({ grades });
  } catch (err) {
    res.status(500).json({ message: "Error fetching grades", error: err.message });
  }
};

/* ══════════════════════════════════════════════
   TEACHER — Create a grade for a student
   POST /api/grades/teacher
   Body: { student, subject, term, week, score, totalScore, remarks }
══════════════════════════════════════════════ */
export const createGrade = async (req, res) => {
  try {
    const { student, subject, term, week, score, totalScore, remarks } = req.body;

    if (!student)  return res.status(400).json({ message: "Student is required" });
    if (!subject)  return res.status(400).json({ message: "Subject is required" });
    if (score == null) return res.status(400).json({ message: "Score is required" });

    const grade = await Grade.create({
      student,
      subject,
      term,
      week:       week       ?? null,
      score:      Number(score),
      totalScore: Number(totalScore ?? 100),
      gradedBy:   req.user.id,
      remarks,
    });

    const populated = await grade.populate("student", "name studentId className");
    res.status(201).json({ message: "Grade saved successfully", grade: populated });
  } catch (err) {
    res.status(500).json({ message: "Error saving grade", error: err.message });
  }
};

/* ══════════════════════════════════════════════
   TEACHER — Update a grade
   PATCH /api/grades/teacher/:gradeId
══════════════════════════════════════════════ */
export const updateGrade = async (req, res) => {
  try {
    const { gradeId } = req.params;
    const { score, totalScore, remarks, term, week, subject } = req.body;

    const grade = await Grade.findOne({ _id: gradeId, gradedBy: req.user.id });
    if (!grade) return res.status(404).json({ message: "Grade not found or not yours" });

    if (score      != null) grade.score      = Number(score);
    if (totalScore != null) grade.totalScore = Number(totalScore);
    if (remarks    != null) grade.remarks    = remarks;
    if (term       != null) grade.term       = term;
    if (week       != null) grade.week       = week;
    if (subject    != null) grade.subject    = subject;

    await grade.save();
    const populated = await grade.populate("student", "name studentId className");
    res.json({ message: "Grade updated", grade: populated });
  } catch (err) {
    res.status(500).json({ message: "Error updating grade", error: err.message });
  }
};

/* ══════════════════════════════════════════════
   TEACHER — Delete a grade
   DELETE /api/grades/teacher/:gradeId
══════════════════════════════════════════════ */
export const deleteGrade = async (req, res) => {
  try {
    const grade = await Grade.findOneAndDelete({
      _id:      req.params.gradeId,
      gradedBy: req.user.id,
    });
    if (!grade) return res.status(404).json({ message: "Grade not found or not yours" });
    res.json({ message: "Grade deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting grade", error: err.message });
  }
};

/* ══════════════════════════════════════════════
   STUDENT — Get their own grades
   GET /api/grades/student/me
══════════════════════════════════════════════ */
export const getMyGrades = async (req, res) => {
  try {
    const grades = await Grade.find({ student: req.user.id })
      .populate("gradedBy", "name")
      .sort({ createdAt: -1 });

    res.json({ grades });
  } catch (err) {
    res.status(500).json({ message: "Error fetching your grades", error: err.message });
  }
};
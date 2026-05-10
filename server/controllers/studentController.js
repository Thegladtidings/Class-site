import Student from "../models/student.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// LOGIN
export const studentLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const student = await Student.findOne({ email });
    if (!student) return res.status(401).json({ message: "Invalid email or password" });

    if (!student.isActive)
      return res.status(403).json({ message: "Account is deactivated. Contact admin." });

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      { id: student._id, email: student.email, role: student.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    const { password: _, ...studentData } = student.toObject();
    res.json({ message: "Login successful", token, student: studentData });
  } catch (err) {
    res.status(500).json({ message: "Error logging in", error: err.message });
  }
};

// REGISTER
export const registerStudent = async (req, res) => {
  try {
    const { name, email, password, className, gender } = req.body;

    const existingStudent = await Student.findOne({ email });
    if (existingStudent) return res.status(400).json({ message: "Email already in use" });

    // ── Generate a unique Student ID ──────────────────────────────
    const generateStudentId = () => {
      const year    = new Date().getFullYear().toString().slice(-2); // e.g. "25"
      const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";                   // no I/O to avoid confusion
      const prefix  = letters[Math.floor(Math.random() * letters.length)] +
                      letters[Math.floor(Math.random() * letters.length)];
      const digits  = String(Math.floor(Math.random() * 9000) + 1000); // 1000–9999
      return `STU-${year}${prefix}${digits}`;                          // e.g. STU-25KR4372
    };

    // Retry until we find an ID not already in the database
    let studentId;
    let collision;
    do {
      studentId = generateStudentId();
      collision = await Student.findOne({ studentId });
    } while (collision);
    // ─────────────────────────────────────────────────────────────

    const hashedPassword = await bcrypt.hash(password, 12);

    const newStudent = new Student({
      name, email, password: hashedPassword, className, gender, studentId,
    });
console.log("New student to be saved:", newStudent); // Debug log
    const student = await newStudent.save();
    const { password: _, ...studentData } = student.toObject();
    res.status(201).json({ message: "Student registered successfully", student: studentData });
} catch (err) {
  res.status(500).json({ message: "Error registering student", error: err.message });
}
};
// UPDATE PROFILE (student updates their own profile)
// NOTE: `name` is intentionally excluded — it cannot be changed after registration.
export const updateStudentProfile = async (req, res) => {
  try {
    const { email } = req.body;

    // Block name changes
    if (req.body.name) {
      return res.status(400).json({ message: "Student name cannot be changed." });
    }

    if (email) {
      const emailExists = await Student.findOne({ email, _id: { $ne: req.user.id } });
      if (emailExists) return res.status(400).json({ message: "Email already in use" });
    }

    /*
      If a file was uploaded via multer + Cloudinary,
      req.file.path contains the Cloudinary URL.
      Otherwise fall back to a URL string in req.body.profileImage (optional).
    */
    const profileImage = req.file?.path ?? req.body.profileImage ?? undefined;

    const student = await Student.findByIdAndUpdate(
      req.user.id,
      {
        ...(email        && { email }),
        ...(profileImage && { profileImage }),
      },
      { new: true, select: "-password" }
    );

    res.json({ message: "Profile updated", student });
  } catch (err) {
    res.status(500).json({ message: "Error updating profile", error: err.message });
  }
};
// GET ALL STUDENTS (teacher/admin)
export const getAllStudents = async (req, res) => {
  try {
    const filter = {};
    if (req.query.className) filter.className = req.query.className;
    const students = await Student.find(filter).select("-password");
    res.json({ students });
  } catch (err) {
    res.status(500).json({ message: "Error fetching students", error: err.message });
  }
};

// GET STUDENT PROFILE (student views their own profile)
export const getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).select("-password");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({ student });
  } catch (err) {
    res.status(500).json({ message: "Error fetching profile", error: err.message });
  }
};
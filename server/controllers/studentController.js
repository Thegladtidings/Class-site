import Student from "../models/student.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// LOGIN
export const studentLogin = async (req, res) => {
  try {
    console.log("Login request body:", req.body); // Debug log
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
    const { name, email, password, className, gender, studentId } = req.body;

    const existingStudent = await Student.findOne({ email });
    if (existingStudent) return res.status(400).json({ message: "Email already in use" });

    const hashedPassword = await bcrypt.hash(password, 12);

    const newStudent = new Student({
      name, email, password: hashedPassword, className, gender, studentId,
    });

    const student = await newStudent.save();
    const { password: _, ...studentData } = student.toObject();
    res.status(201).json({ message: "Student registered successfully", student: studentData });
  } catch (err) {
    res.status(500).json({ message: "Error registering student", error: err.message });
  }
};

// UPDATE PROFILE (student updates their own profile)
export const updateStudentProfile = async (req, res) => {
  try {
    const { email, name, profileImage } = req.body;

    if (email) {
      const emailExists = await Student.findOne({ email, _id: { $ne: req.user.id } });
      if (emailExists) return res.status(400).json({ message: "Email already in use" });
    }

    const student = await Student.findByIdAndUpdate(
      req.user.id,
      { ...(email && { email }), ...(name && { name }), ...(profileImage && { profileImage }) },
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
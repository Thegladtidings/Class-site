import Teacher from "../models/teacher.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// REGISTER TEACHER
export const registerTeacher = async (req, res) => {
  try {
    const { name, email, password, subject, classNames, gender, employeeId } = req.body;

    const existing = await Teacher.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already in use" });

    const hashedPassword = await bcrypt.hash(password, 12);

    const teacher = await Teacher.create({
      name, email, password: hashedPassword, subject, classNames, gender, employeeId,
    });

    const { password: _, ...teacherData } = teacher.toObject();
    res.status(201).json({ message: "Teacher registered successfully", teacher: teacherData });
  } catch (err) {
    res.status(500).json({ message: "Error registering teacher", error: err.message });
  }
};

// LOGIN TEACHER
export const teacherLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const teacher = await Teacher.findOne({ email });
    if (!teacher) return res.status(401).json({ message: "Invalid email or password" });

    if (!teacher.isActive)
      return res.status(403).json({ message: "Account deactivated. Contact admin." });

    const isMatch = await bcrypt.compare(password, teacher.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      { id: teacher._id, email: teacher.email, role: teacher.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    const { password: _, ...teacherData } = teacher.toObject();
    res.json({ message: "Login successful", token, teacher: teacherData });
  } catch (err) {
    res.status(500).json({ message: "Error logging in", error: err.message });
  }
};

// GET TEACHER PROFILE
export const getTeacherProfile = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.user.id).select("-password");
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    res.json({ teacher });
  } catch (err) {
    res.status(500).json({ message: "Error fetching profile", error: err.message });
  }
};

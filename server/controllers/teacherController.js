import Teacher from "../models/teacher.js";
import Student from "../models/student.js";
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
export const bulkRegisterStudents = async (req, res) => {
  try {
    const students = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        message: "Please provide an array of students",
      });
    }

    // ── Shared ID generator (same algorithm as registerStudent) ───
    const generateStudentId = () => {
      const year    = new Date().getFullYear().toString().slice(-2);
      const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I/O to avoid confusion
      const prefix  = letters[Math.floor(Math.random() * letters.length)] +
                      letters[Math.floor(Math.random() * letters.length)];
      const digits  = String(Math.floor(Math.random() * 9000) + 1000); // 1000–9999
      return `STU-${year}${prefix}${digits}`;                          // e.g. STU-25KR4372
    };

    // Track IDs used within this batch to prevent intra-batch collisions
    const usedInBatch = new Set();

    const getUniqueId = async () => {
      let id;
      let collision;
      do {
        id = generateStudentId();
        // Must be unused both in this batch and in the database
        if (usedInBatch.has(id)) continue;
        collision = await Student.findOne({ studentId: id });
      } while (collision);
      usedInBatch.add(id);
      return id;
    };
    // ─────────────────────────────────────────────────────────────

    const formattedStudents = [];
    const skippedEmails     = [];

    for (const student of students) {
      const { name, email, password, className, gender } = student;

      // Skip duplicate emails
      const existingStudent = await Student.findOne({ email });
      if (existingStudent) {
        skippedEmails.push(email);
        continue;
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const studentId      = await getUniqueId();

      formattedStudents.push({
        name,
        email,
        password: hashedPassword,
        className,
        gender,
        studentId,
      });
    }

    if (formattedStudents.length === 0) {
      return res.status(400).json({
        message: "No new students to register. All emails already exist.",
        skippedEmails,
      });
    }

    // Insert all valid students
    const savedStudents = await Student.insertMany(formattedStudents);

    // Strip passwords from response
    const studentsWithoutPasswords = savedStudents.map((student) => {
      const { password, ...studentData } = student.toObject();
      return studentData;
    });

    res.status(201).json({
      message: `${studentsWithoutPasswords.length} student${studentsWithoutPasswords.length !== 1 ? "s" : ""} registered successfully`,
      students: studentsWithoutPasswords,
      ...(skippedEmails.length > 0 && {
        skipped: `${skippedEmails.length} email${skippedEmails.length !== 1 ? "s" : ""} already in use`,
        skippedEmails,
      }),
    });

  } catch (err) {
    res.status(500).json({
      message: "Error registering students",
      error: err.message,
    });
  }
};
// LOGIN TEACHER
export const teacherLogin = async (req, res) => {
  try {
    const { email, password} = req.body;

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

export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id).select("-password");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({ student });
  } catch (err) {
    res.status(500).json({ message: "Error fetching student", error: err.message });
  }
};

export const updateTeacherProfile = async (req, res) => {
  try {
    const { name, email, subject, classNames, profileImage, password } = req.body;

    // 🔒 Check if email is being changed and already exists
    if (email) {
      const emailExists = await Teacher.findOne({
        email,
        _id: { $ne: req.user.id }
      });

      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    // 🔐 Handle password update (optional)
    let updatedFields = {
      ...(name && { name }),
      ...(email && { email }),
      ...(subject && { subject }),
      ...(classNames && { classNames }),
      ...(profileImage && { profileImage }),
    };

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      updatedFields.password = hashedPassword;
    }

    const teacher = await Teacher.findByIdAndUpdate(
      req.user.id,
      updatedFields,
      { new: true, select: "-password" }
    );

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.json({ message: "Profile updated successfully", teacher });

  } catch (err) {
    res.status(500).json({ message: "Error updating profile", error: err.message });
  }
};

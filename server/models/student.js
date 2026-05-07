import mongoose from "mongoose";    

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, default: 'student' },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  className: { type: String, required: true },
  profileImage: { type: String, default: null }, // Cloudinary/S3 URL
  studentId: { type: String, unique: true, sparse: true }, // e.g. "JSS2-001"
  gender: { type: String, enum: ['Male', 'Female'] },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);

export default Student;
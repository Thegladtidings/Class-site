import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  email:        { type: String, required: true, unique: true },
  password:     { type: String, required: true },
  role:         { type: String, default: "teacher" },
  subject:      { type: String },               // main subject taught
  classNames:   [{ type: String }],             // classes this teacher handles
  profileImage: { type: String, default: null },
  employeeId:   { type: String, unique: true, sparse: true },
  gender:       { type: String, enum: ["male", "female"] },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

const Teacher = mongoose.model("Teacher", teacherSchema);
export default Teacher;

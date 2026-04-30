/**
 * seedStudents.js
 * ─────────────────────────────────────────────────────────────
 * Run once to insert sample students with hashed passwords.
 * Also hashes any existing plain-text passwords already in DB.
 *
 * Usage:
 *   node seedStudents.js
 * ─────────────────────────────────────────────────────────────
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

config(); // load .env

// ── Inline schema (mirrors your actual model) ─────────────────
const studentSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  role:         { type: String, default: 'student' },
  email:        { type: String, required: true, unique: true },
  password:     { type: String, required: true },
  className:    { type: String, required: true },
  profileImage: { type: String, default: null },
  studentId:    { type: String, unique: true, sparse: true },
  gender:       { type: String, enum: ['male', 'female'] },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);

// ── Sample students to insert ─────────────────────────────────
// Edit these however you like before running the script.
const STUDENTS = [
  {
    name:      'Unaysah',
    email:     'unaysah@school.com',
    password:  'student123',
    className: 'JSS 2',
    studentId: 'JSS2-001',
    gender:    'female',
  },
  {
    name:      'Ibrahim',
    email:     'ibrahim@school.com',
    password:  'student123',
    className: 'JSS 2',
    studentId: 'JSS2-002',
    gender:    'male',
  },
  {
    name:      'Kamaldeen',
    email:     'kamaldeen@school.com',
    password:  'student123',
    className: 'JSS 2',
    studentId: 'JSS2-003',
    gender:    'male',
  },
  {
    name:      'Hussein',
    email:     'hussein@school.com',
    password:  'student123',
    className: 'JSS 2',
    studentId: 'JSS2-004',
    gender:    'male',
  },
  {
    name:      'Hassan',
    email:     'hassan@school.com',
    password:  'student123',
    className: 'JSS 2',
    studentId: 'JSS2-005',
    gender:    'male',
  },
  {
    name:      'Sofiyah',
    email:     'sofiyah@school.com',
    password:  'student123',
    className: 'JSS 2',
    studentId: 'JSS2-006',
    gender:    'female',
  },
  {
    name:      'Haneefah',
    email:     'haneefah@school.com',
    password:  'student123',
    className: 'JSS 2',
    studentId: 'JSS2-007',
    gender:    'female',
  },
  {
    name:      'Abubakr',
    email:     'abubakr@school.com',
    password:  'student123',
    className: 'JSS 2',
    studentId: 'JSS2-008',
    gender:    'male',
  },
  {
    name:      "Na'eemah",
    email:     'naeemah@school.com',
    password:  'student123',
    className: 'JSS 2',
    studentId: 'JSS2-009',
    gender:    'female',
  },
  {
    name:      'Augustine',
    email:     'augustine@school.com',
    password:  'student123',
    className: 'JSS 2',
    studentId: 'JSS2-010',
    gender:    'male',
  },
  {
    name:      'Royhan',
    email:     'royhan@school.com',
    password:  'student123',
    className: 'JSS 2',
    studentId: 'JSS2-011',
    gender:    'male',
  },
  {
    name:      'Furqan',
    email:     'furqan@school.com',
    password:  'student123',
    className: 'JSS 2',
    studentId: 'JSS2-012',
    gender:    'male',
  },
  {
    name:      'Abdulroheem',
    email:     'abdulroheem@school.com',
    password:  'student123',
    className: 'JSS 2',
    studentId: 'JSS2-013',
    gender:    'male',
  },
];

const SALT_ROUNDS = 12;

const isAlreadyHashed = (password) =>
  password.startsWith('$2a$') || password.startsWith('$2b$');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB\n');

  // ── 1. Hash + insert new sample students ─────────────────────
  console.log('── Inserting sample students ──────────────────────────');
  for (const data of STUDENTS) {
    const exists = await Student.findOne({ email: data.email });
    if (exists) {
      console.log(`  ⏭  Skipped (already exists): ${data.email}`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
    await Student.create({ ...data, password: hashedPassword });
    console.log(`  ✔  Inserted: ${data.name} (${data.email})`);
  }

  // ── 2. Hash any existing plain-text passwords in the DB ───────
  console.log('\n── Hashing existing plain-text passwords ───────────────');
  const allStudents = await Student.find({});
  let hashed = 0;
  let skipped = 0;

  for (const student of allStudents) {
    if (isAlreadyHashed(student.password)) {
      skipped++;
      continue;
    }
    const newHash = await bcrypt.hash(student.password, SALT_ROUNDS);
    await Student.updateOne({ _id: student._id }, { $set: { password: newHash } });
    console.log(`  🔒 Hashed password for: ${student.email}`);
    hashed++;
  }

  console.log(`\n  Done — ${hashed} hashed, ${skipped} already secure.\n`);

  // ── 3. Print login credentials for testing ───────────────────
  console.log('── Test login credentials ─────────────────────────────');
  for (const s of STUDENTS) {
    console.log(`  Email: ${s.email}  |  Password: ${s.password}`);
  }

  console.log('\n🎉 Seed complete.\n');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Seed failed:', err.message);
  mongoose.disconnect();
  process.exit(1);
});
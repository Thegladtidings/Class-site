import express from 'express';
import { configDotenv } from 'dotenv';
import connectDB from './config/database.js';

import studentRoutes    from './routes/studentRoute.js';
import teacherRoutes    from './routes/teacherRoute.js';
import assignmentRoutes from './routes/assignmentRoute.js';
import examRoutes       from './routes/examRoute.js';

configDotenv();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/students',    studentRoutes);
app.use('/api/teachers',    teacherRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/exams',       examRoutes);

app.get('/', (req, res) => res.send('School API is running ✅'));

app.listen(PORT, () => {
  connectDB();
  console.log(`Server is running on port ${PORT}`);
});

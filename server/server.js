import express from 'express';
import { configDotenv } from 'dotenv';
import connectDB from './config/database.js';
import cors from 'cors';
import studentRoutes    from './routes/studentRoute.js';
import teacherRoutes    from './routes/teacherRoute.js';
import assignmentRoutes from './routes/assignmentRoute.js';
import examRoutes       from './routes/examRoute.js';

configDotenv();

const app = express();
const PORT = process.env.PORT || 4000;
const allowedOrigins = [
  "http://localhost:5173",
"https://class-site-flax.vercel.app",
"https://class-sites.netlify.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
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

/**
 * Mock data initialization for React Context
 */

import { storage } from './storage';

const STUDENTS_DATA = [
  { id: 'S001', name: 'Adegbite Adekunle', email: 'adekunle@school.com', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Adekunle', gender: 'M', role: 'student' },
  { id: 'S002', name: 'Blessing Okoro', email: 'blessing@school.com', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Blessing', gender: 'F', role: 'student' },
  { id: 'S003', name: 'Chidinma Okafor', email: 'chidinma@school.com', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chidinma', gender: 'F', role: 'student' },
];

const TEACHERS_DATA = [
  { id: 'T001', name: 'Mrs. Amina Okafor', email: 'amina@school.com', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amina', department: 'Mathematics', role: 'teacher' },
  { id: 'T002', name: 'Mr. Segun Adekunle', email: 'segun@school.com', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Segun', department: 'English', role: 'teacher' },
];

const EXAMS_DATA = [
  {
    id: 'EX001',
    name: 'Mathematics Term 1 CBT',
    subject: 'Mathematics',
    description: 'Comprehensive exam covering algebra and geometry',
    startDateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    endDateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 120,
    totalQuestions: 50,
    published: true,
    createdBy: 'T001',
    createdDate: '2024-04-28',
    questions: 'Q001-Q050',
  },
  {
    id: 'EX002',
    name: 'English Literature Test',
    subject: 'English',
    description: 'Test on poetry and prose analysis',
    startDateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    endDateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
    durationMinutes: 90,
    totalQuestions: 40,
    published: true,
    createdBy: 'T002',
    createdDate: '2024-04-27',
    questions: 'Q101-Q140',
  },
  {
    id: 'EX003',
    name: 'Science Practical Exam',
    subject: 'Science',
    description: 'Theory questions on biology, chemistry, physics',
    startDateTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    endDateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    durationMinutes: 180,
    totalQuestions: 60,
    published: true,
    createdBy: 'T001',
    createdDate: '2024-04-25',
    questions: 'Q201-Q260',
  },
];

const EXAM_QUESTIONS_DATA = [
  { id: 'Q001', examId: 'EX001', questionText: 'What is 2 + 2?', options: { A: '3', B: '4', C: '5', D: '6' }, correctAnswer: 'B', explanation: '2 + 2 equals 4' },
  { id: 'Q002', examId: 'EX001', questionText: 'Solve: 2x + 5 = 13', options: { A: '3', B: '4', C: '5', D: '6' }, correctAnswer: 'B', explanation: 'x = 4 when 2(4) + 5 = 13' },
  { id: 'Q003', examId: 'EX001', questionText: 'What is the area of a circle with radius 5?', options: { A: '25π', B: '10π', C: '50π', D: '75π' }, correctAnswer: 'A', explanation: 'Area = πr² = π(5)² = 25π' },
  { id: 'Q004', examId: 'EX001', questionText: 'What is 15% of 200?', options: { A: '20', B: '25', C: '30', D: '35' }, correctAnswer: 'C', explanation: '15% × 200 = 0.15 × 200 = 30' },
  { id: 'Q005', examId: 'EX001', questionText: 'Simplify: √144', options: { A: '10', B: '11', C: '12', D: '13' }, correctAnswer: 'C', explanation: '√144 = 12' },
  { id: 'Q101', examId: 'EX002', questionText: 'Who wrote "Romeo and Juliet"?', options: { A: 'Jane Austen', B: 'William Shakespeare', C: 'Charles Dickens', D: 'Oscar Wilde' }, correctAnswer: 'B', explanation: 'William Shakespeare wrote "Romeo and Juliet"' },
  { id: 'Q201', examId: 'EX003', questionText: 'What is the chemical formula for water?', options: { A: 'H2O', B: 'CO2', C: 'O2', D: 'NaCl' }, correctAnswer: 'A', explanation: 'Water is composed of 2 hydrogen atoms and 1 oxygen atom' },
];

// Initialize data in localStorage
export const initializeMockData = () => {
  const allUsers = storage.get('jss_users') || [...STUDENTS_DATA, ...TEACHERS_DATA];
  if (!storage.get('jss_users')) {
    storage.set('jss_users', allUsers);
  }

  if (!storage.get('jss_exams')) {
    storage.set('jss_exams', EXAMS_DATA);
  }

  if (!storage.get('jss_exam_questions')) {
    storage.set('jss_exam_questions', EXAM_QUESTIONS_DATA);
  }

  if (!storage.get('jss_exam_sessions')) {
    storage.set('jss_exam_sessions', []);
  }
};

// Exam functions
export const getExams = () => {
  let exams = storage.get('jss_exams');
  if (!exams) {
    exams = EXAMS_DATA;
    storage.set('jss_exams', exams);
  }
  return exams;
};

export const getExamById = (examId) => {
  const exams = getExams();
  return exams.find(e => e.id === examId);
};

export const getExamQuestions = (examId) => {
  let questions = storage.get('jss_exam_questions');
  if (!questions) {
    questions = EXAM_QUESTIONS_DATA;
    storage.set('jss_exam_questions', questions);
  }
  return questions.filter(q => q.examId === examId);
};

export const getQuestionById = (questionId) => {
  let questions = storage.get('jss_exam_questions');
  if (!questions) {
    questions = EXAM_QUESTIONS_DATA;
    storage.set('jss_exam_questions', questions);
  }
  return questions.find(q => q.id === questionId);
};

export const getExamSessions = () => {
  let sessions = storage.get('jss_exam_sessions');
  if (!sessions) {
    sessions = [];
    storage.set('jss_exam_sessions', sessions);
  }
  return sessions;
};

export const getExamSession = (sessionId) => {
  const sessions = getExamSessions();
  return sessions.find(s => s.id === sessionId);
};

export const getStudentExamSessions = (studentId) => {
  const sessions = getExamSessions();
  return sessions.filter(s => s.studentId === studentId);
};

export const createExamSession = (examId, studentId) => {
  const sessions = getExamSessions();
  const sessionId = 'SES' + Date.now();
  const session = {
    id: sessionId,
    examId,
    studentId,
    startedAt: new Date().toISOString(),
    submittedAt: null,
    answers: [],
    score: null,
    percentage: null,
    status: 'in-progress',
  };
  sessions.push(session);
  storage.set('jss_exam_sessions', sessions);
  return session;
};

export const saveExamAnswer = (sessionId, questionId, selectedAnswer) => {
  const sessions = getExamSessions();
  const session = sessions.find(s => s.id === sessionId);
  if (session) {
    const answerIndex = session.answers.findIndex(a => a.questionId === questionId);
    if (answerIndex > -1) {
      session.answers[answerIndex].selectedAnswer = selectedAnswer;
    } else {
      session.answers.push({ questionId, selectedAnswer });
    }
    storage.set('jss_exam_sessions', sessions);
  }
};

export const submitExam = (sessionId) => {
  const sessions = getExamSessions();
  const session = sessions.find(s => s.id === sessionId);
  if (session) {
    const exam = getExamById(session.examId);
    const questions = getExamQuestions(exam.id);
    
    let correctCount = 0;
    session.answers.forEach(answer => {
      const question = questions.find(q => q.id === answer.questionId);
      if (question && question.correctAnswer === answer.selectedAnswer) {
        correctCount++;
      }
    });
    
    session.score = correctCount;
    session.percentage = Math.round((correctCount / questions.length) * 100);
    session.submittedAt = new Date().toISOString();
    session.status = 'submitted';
    
    storage.set('jss_exam_sessions', sessions);
    return session;
  }
};

// Student functions
export const getStudents = () => {
  let users = storage.get('jss_users');
  if (!users) {
    users = [...STUDENTS_DATA, ...TEACHERS_DATA];
    storage.set('jss_users', users);
  }
  return users.filter(u => u.role === 'student');
};

export const getStudentById = (studentId) => {
  const students = getStudents();
  return students.find(s => s.id === studentId);
};

export const updateStudent = (studentId, updates) => {
  let users = storage.get('jss_users') || [...STUDENTS_DATA, ...TEACHERS_DATA];
  const userIndex = users.findIndex(u => u.id === studentId);
  if (userIndex > -1) {
    users[userIndex] = { ...users[userIndex], ...updates };
    storage.set('jss_users', users);
    return users[userIndex];
  }
};

// Grades (stub)
export const getGrades = (studentId) => {
  return [];
};

export const addGrade = (gradeData) => {
  return gradeData;
};

// Assignments (stub)
export const getAssignments = () => {
  return [];
};

export const getStudentAssignments = (studentId) => {
  return [];
};

export const addAssignment = (assignmentData) => {
  return assignmentData;
};

export const submitAssignment = (assignmentId, studentId, submissionData) => {
  return submissionData;
};

// Announcements (stub)
export const getAnnouncements = () => {
  return [];
};

export const addAnnouncement = (announcementData) => {
  return announcementData;
};

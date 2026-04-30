import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { initializeMockData } from './utils/mockData';

// Initialize mock data on app load
initializeMockData();

// Pages
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/student/Dashboard';
import StudentGrades from './pages/student/Grades';
import StudentAssignments from './pages/student/Assignments';
import StudentAnnouncements from './pages/student/Announcements';
import StudentProfile from './pages/student/Profile';
import StudentExams from './pages/student/Exams';
import StudentExamActive from './pages/student/ExamActive';
import StudentExamResults from './pages/student/ExamResults';

import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherStudents from './pages/teacher/Students';
import TeacherGrades from './pages/teacher/Grades';
import TeacherAssignments from './pages/teacher/Assignments';
import TeacherAnnouncements from './pages/teacher/Announcements';
import TeacherExams from './pages/teacher/Exams';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            {/* Student Routes */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/grades"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentGrades />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/assignments"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentAssignments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/announcements"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentAnnouncements />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/profile"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/exams"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentExams />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/exam/:examId"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentExamActive />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/exam-results/:sessionId"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentExamResults />
                </ProtectedRoute>
              }
            />

            {/* Teacher Routes */}
            <Route
              path="/teacher/dashboard"
              element={
                <ProtectedRoute requiredRole="teacher">
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/students"
              element={
                <ProtectedRoute requiredRole="teacher">
                  <TeacherStudents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/grades"
              element={
                <ProtectedRoute requiredRole="teacher">
                  <TeacherGrades />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/assignments"
              element={
                <ProtectedRoute requiredRole="teacher">
                  <TeacherAssignments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/announcements"
              element={
                <ProtectedRoute requiredRole="teacher">
                  <TeacherAnnouncements />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/exams"
              element={
                <ProtectedRoute requiredRole="teacher">
                  <TeacherExams />
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

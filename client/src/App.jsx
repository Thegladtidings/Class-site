import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';

const DataProvider = lazy(() =>
  import('./contexts/DataContext').then(({ DataProvider: Provider }) => ({ default: Provider }))
);
const LandingPage = lazy(() => import('./pages/LandingPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const StudentDashboard = lazy(() => import('./pages/student/Dashboard.jsx'));
const StudentGrades = lazy(() => import('./pages/student/Grades.jsx'));
const StudentAssignments = lazy(() => import('./pages/student/Assignments.jsx'));
const StudentAnnouncements = lazy(() => import('./pages/student/Announcements.jsx'));
const StudentProfile = lazy(() => import('./pages/student/Profile.jsx'));
const StudentExams = lazy(() => import('./pages/student/Exams.jsx'));
const TeacherDashboard = lazy(() => import('./pages/teacher/Dashboard.jsx'));
const TeacherStudents = lazy(() => import('./pages/teacher/Students.jsx'));
const TeacherGrades = lazy(() => import('./pages/teacher/Grades.jsx'));
const TeacherAssignments = lazy(() => import('./pages/teacher/Assignments.jsx'));
const TeacherAnnouncements = lazy(() => import('./pages/teacher/Announcements.jsx'));
const TeacherExams = lazy(() => import('./pages/teacher/Exams.jsx'));

function PortalRoute({ requiredRole, children }) {
  return (
    <ProtectedRoute requiredRole={requiredRole}>
      <DataProvider>{children}</DataProvider>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={
        <div role="status" style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "sans-serif", color: "#147d6c" }}>
          Loading ClassSite…
        </div>
      }>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Student Routes */}
            <Route
              path="/student/dashboard"
              element={
                <PortalRoute requiredRole="student">
                  <StudentDashboard />
                </PortalRoute>
              }
            />
            <Route
              path="/student/grades"
              element={
                <PortalRoute requiredRole="student">
                  <StudentGrades />
                </PortalRoute>
              }
            />
            <Route
              path="/student/assignments"
              element={
                <PortalRoute requiredRole="student">
                  <StudentAssignments />
                </PortalRoute>
              }
            />
            <Route
              path="/student/announcements"
              element={
                <PortalRoute requiredRole="student">
                  <StudentAnnouncements />
                </PortalRoute>
              }
            />
            <Route
              path="/student/profile"
              element={
                <PortalRoute requiredRole="student">
                  <StudentProfile />
                </PortalRoute>
              }
            />
            <Route
              path="/student/exams"
              element={
                <PortalRoute requiredRole="student">
                  <StudentExams />
                </PortalRoute>
              }
            />
            
            
            {/* Teacher Routes */}
            <Route
              path="/teacher/dashboard"
              element={
                <PortalRoute requiredRole="teacher">
                  <TeacherDashboard />
                </PortalRoute>
              }
            />
            <Route
              path="/teacher/students"
              element={
                <PortalRoute requiredRole="teacher">
                  <TeacherStudents />
                </PortalRoute>
              }
            />
            <Route
              path="/teacher/grades"
              element={
                <PortalRoute requiredRole="teacher">
                  <TeacherGrades />
                </PortalRoute>
              }
            />
            <Route
              path="/teacher/assignments"
              element={
                <PortalRoute requiredRole="teacher">
                  <TeacherAssignments />
                </PortalRoute>
              }
            />
            <Route
              path="/teacher/announcements"
              element={
                <PortalRoute requiredRole="teacher">
                  <TeacherAnnouncements />
                </PortalRoute>
              }
            />
            <Route
              path="/teacher/exams"
              element={
                <PortalRoute requiredRole="teacher">
                  <TeacherExams />
                </PortalRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

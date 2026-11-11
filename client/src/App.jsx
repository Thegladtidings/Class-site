import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';

const DataProvider = lazy(() =>
  import('./contexts/DataContext').then(({ DataProvider: Provider }) => ({ default: Provider }))
);
const LandingPage = lazy(() => import('./pages/LandingPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const StudentDashboard = lazy(() => import('./pages/student/Dashboard.jsx'));
const TeacherDashboard = lazy(() => import('./pages/teacher/Dashboard.jsx'));

function PortalRoute({ requiredRole, children }) {
  return (
    <ProtectedRoute requiredRole={requiredRole}>
      <DataProvider>{children}</DataProvider>
    </ProtectedRoute>
  );
}

function StudentPortal({ section }) {
  return (
    <PortalRoute requiredRole="student">
      <StudentDashboard initialSection={section} />
    </PortalRoute>
  );
}

function TeacherPortal({ section }) {
  return (
    <PortalRoute requiredRole="teacher">
      <TeacherDashboard initialSection={section} />
    </PortalRoute>
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

          <Route path="/student/dashboard" element={<StudentPortal section="dashboard" />} />
          <Route path="/student/assignments" element={<StudentPortal section="assignments" />} />
          <Route path="/student/exams" element={<StudentPortal section="exams" />} />
          <Route path="/student/grades" element={<StudentPortal section="grades" />} />
          <Route path="/student/announcements" element={<StudentPortal section="announcements" />} />
          <Route path="/student/schedule" element={<StudentPortal section="schedule" />} />
          <Route path="/student/profile" element={<StudentPortal section="profile" />} />

          <Route path="/teacher/dashboard" element={<TeacherPortal section="dashboard" />} />
          <Route path="/teacher/students" element={<TeacherPortal section="students" />} />
          <Route path="/teacher/assignments" element={<TeacherPortal section="assignments" />} />
          <Route path="/teacher/exams" element={<TeacherPortal section="exams" />} />
          <Route path="/teacher/grades" element={<TeacherPortal section="grades" />} />
          <Route path="/teacher/announcements" element={<TeacherPortal section="announcements" />} />
          <Route path="/teacher/schedule" element={<TeacherPortal section="schedule" />} />
          <Route path="/teacher/profile" element={<TeacherPortal section="profile" />} />
          <Route path="/teacher/settings" element={<Navigate to="/teacher/profile" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

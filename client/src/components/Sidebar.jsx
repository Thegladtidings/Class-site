import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Sidebar = () => {
  const { state } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isStudent = state.role === 'student';

  const studentLinks = [
    { label: 'Dashboard', path: '/student/dashboard', icon: '📊' },
    { label: 'My Grades', path: '/student/grades', icon: '📈' },
    { label: 'Assignments', path: '/student/assignments', icon: '📝' },
    { label: 'Announcements', path: '/student/announcements', icon: '📢' },
    { label: 'Exams', path: '/student/exams', icon: '📋' },
    { label: 'Profile', path: '/student/profile', icon: '👤' },
  ];

  const teacherLinks = [
    { label: 'Dashboard', path: '/teacher/dashboard', icon: '📊' },
    { label: 'Students', path: '/teacher/students', icon: '👨‍🎓' },
    { label: 'Grade Management', path: '/teacher/grades', icon: '📊' },
    { label: 'Assignments', path: '/teacher/assignments', icon: '📝' },
    { label: 'Announcements', path: '/teacher/announcements', icon: '📢' },
    { label: 'Exams', path: '/teacher/exams', icon: '📋' },
  ];

  const links = isStudent ? studentLinks : teacherLinks;

  const handleNavClick = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  return (
    <>
      <aside className={`sidebar ${sidebarOpen ? 'mobile-active' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">JSS 2 Portal</h2>
        </div>
        
        <nav className="sidebar-nav">
          {links.map((link) => (
            <button
              key={link.path}
              className="sidebar-nav-link"
              onClick={() => handleNavClick(link.path)}
            >
              <span className="sidebar-nav-icon">{link.icon}</span>
              <span className="sidebar-nav-text">{link.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <button 
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        ☰
      </button>
    </>
  );
};

import React from 'react';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';

export default function TeacherAnnouncements() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Announcements" />
        <div className="content">
          <div className="page-container">
            <h2>Announcements</h2>
            <p>Announcements page - coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

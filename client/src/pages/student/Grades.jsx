import React from 'react';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';

export default function StudentGrades() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title="My Grades" />
        <div className="content">
          <div className="page-container">
            <h2>My Grades</h2>
            <p>Grade management page - coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

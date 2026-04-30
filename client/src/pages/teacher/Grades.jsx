import React from 'react';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';

export default function TeacherGrades() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Grade Management" />
        <div className="content">
          <div className="page-container">
            <h2>Grade Management</h2>
            <p>Grade management page - coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

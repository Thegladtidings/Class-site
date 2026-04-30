import React from 'react';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';

export default function TeacherExams() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Exam Management" />
        <div className="content">
          <div className="page-container">
            <h2>Exam Management</h2>
            <p>Exam management page - coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

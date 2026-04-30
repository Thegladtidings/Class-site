import React from 'react';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';

export default function TeacherStudents() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Students" />
        <div className="content">
          <div className="page-container">
            <h2>Students</h2>
            <p>Students page - coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

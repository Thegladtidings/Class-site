import React from 'react';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';

export default function TeacherAssignments() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Assignments" />
        <div className="content">
          <div className="page-container">
            <h2>Assignments</h2>
            <p>Assignments page - coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

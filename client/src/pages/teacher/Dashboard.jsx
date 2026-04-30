import React from 'react';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';

export default function TeacherDashboard() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Dashboard" />
        <div className="content">
          <div className="page-container">
            <h2>Teacher Dashboard</h2>
            <p>Dashboard page - coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

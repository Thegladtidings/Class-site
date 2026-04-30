import React from 'react';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';

export default function StudentDashboard() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Dashboard" />
        <div className="content">
          <div className="page-container">
            <h2>Welcome to Your Dashboard</h2>
            <p>This is your student dashboard. More features coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

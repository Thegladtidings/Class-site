import React from 'react';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';

export default function StudentProfile() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Profile" />
        <div className="content">
          <div className="page-container">
            <h2>Profile</h2>
            <p>Profile page - coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

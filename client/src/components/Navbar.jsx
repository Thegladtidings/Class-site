import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Navbar = ({ title }) => {
  const { state, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [timer, setTimer] = useState(null);
  const [timerColor, setTimerColor] = useState('#27ae60');

  const user = state.user;
  const firstLetter = user?.name?.charAt(0).toUpperCase() || 'U';

  // Check for active exam session
  useEffect(() => {
    const sessionData = sessionStorage.getItem('active_exam_session');
    
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        const endTime = new Date(session.endTime).getTime();
        
        const updateTimer = () => {
          const now = new Date().getTime();
          const timeRemaining = endTime - now;
          
          if (timeRemaining <= 0) {
            setTimer('00:00:00');
            return;
          }
          
          const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
          const mins = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
          const secs = Math.floor((timeRemaining % (1000 * 60)) / 1000);
          
          setTimer(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
          
          // Change color based on time remaining
          if (timeRemaining < 5 * 60 * 1000) {
            setTimerColor('#e74c3c');
          } else if (timeRemaining < 15 * 60 * 1000) {
            setTimerColor('#f39c12');
          } else {
            setTimerColor('#27ae60');
          }
        };
        
        updateTimer();
        const timerInterval = setInterval(updateTimer, 1000);
        
        return () => clearInterval(timerInterval);
      } catch (error) {
        console.error('Error initializing exam timer:', error);
      }
    }
  }, []);

  const handleLogout = async () => {
    logout();
    navigate('/login');
  };

  const handleProfile = () => {
    const role = state.role;
    navigate(role === 'student' ? '/student/profile' : '/teacher/profile');
    setDropdownOpen(false);
  };

  return (
    <div className="navbar">
      <div className="navbar-left">
        <h1 className="navbar-title">{title}</h1>
      </div>

      {timer && (
        <div className="navbar-exam-timer">
          <span className="exam-timer-label">Time Remaining:</span>
          <span className="exam-timer" style={{ color: timerColor }}>
            {timer}
          </span>
        </div>
      )}

      <div className="navbar-user">
        <div className="navbar-user-info">
          <div className="navbar-user-name">{user?.name || 'User'}</div>
          <div className="navbar-user-role">{user?.role}</div>
        </div>
        <div className="navbar-user-avatar" onClick={() => setDropdownOpen(!dropdownOpen)}>
          {firstLetter}
        </div>
        {dropdownOpen && (
          <div className="navbar-dropdown active">
            <div className="navbar-dropdown-item" onClick={handleProfile}>
              Profile
            </div>
            <div className="navbar-dropdown-item danger" onClick={handleLogout}>
              Logout
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

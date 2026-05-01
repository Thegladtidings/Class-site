import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { useData } from '../../contexts/DataContext';
import '../../css/exam.css';

export default function StudentExams() {
  const navigate = useNavigate();
  const { getExams, getStudentExamSessions, createExamSession } = useData();
  const [exams, setExams] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const allExams = getExams();
        const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null;
        const studentSessions = getStudentExamSessions(userId);
        setExams(allExams);
        setSessions(studentSessions);
      } catch (error) {
        console.error('Error loading exams:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getExamStatus = (exam) => {
    const now = new Date();
    const startTime = new Date(exam.startDateTime);
    const endTime = new Date(exam.endDateTime);

    if (now < startTime) return 'upcoming';
    if (now > endTime) return 'closed';
    return 'active';
  };

  const getSessionForExam = (examId) => {
    return sessions.find(s => s.examId === examId);
  };

  const handleStartExam = async (examId) => {
    try {
      const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null;
      const session = await createExamSession(examId, userId);
      const exam = exams.find(e => e.id === examId);
      
      // Store exam session in sessionStorage
      sessionStorage.setItem('active_exam_session', JSON.stringify({
        sessionId: session.id,
        examId,
        startTime: new Date(),
        endTime: new Date(Date.now() + exam.durationMinutes * 60 * 1000),
      }));

      navigate(`/student/exam/${examId}`);
    } catch (error) {
      console.error('Error starting exam:', error);
    }
  };

  const handleReviewResults = (sessionId) => {
    navigate(`/student/exam-results/${sessionId}`);
  };

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <Navbar title="Exams" />
          <div className="content">
            <div className="loading">Loading exams...</div>
          </div>
        </div>
      </div>
    );
  }

  const upcoming = exams.filter(e => getExamStatus(e) === 'upcoming');
  const active = exams.filter(e => getExamStatus(e) === 'active');
  const past = exams.filter(e => getExamStatus(e) === 'closed');

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Exams" />
        <div className="content">
          <div className="page-container">
            {active.length > 0 && (
              <section className="exam-section active-exams">
                <h2>Active Exams</h2>
                <div className="exam-grid">
                  {active.map(exam => (
                    <div key={exam.id} className="exam-card active">
                      <div className="exam-header">
                        <h3>{exam.name}</h3>
                        <span className="exam-badge active">Active</span>
                      </div>
                      <p className="exam-subject">{exam.subject}</p>
                      <p className="exam-description">{exam.description}</p>
                      <div className="exam-details">
                        <span>Duration: {exam.durationMinutes} min</span>
                        <span>Questions: {exam.totalQuestions}</span>
                      </div>
                      <button 
                        className="exam-start-btn"
                        onClick={() => handleStartExam(exam.id)}
                      >
                        Start Exam
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {upcoming.length > 0 && (
              <section className="exam-section upcoming-exams">
                <h2>Upcoming Exams</h2>
                <div className="exam-grid">
                  {upcoming.map(exam => {
                    const startTime = new Date(exam.startDateTime);
                    return (
                      <div key={exam.id} className="exam-card">
                        <div className="exam-header">
                          <h3>{exam.name}</h3>
                          <span className="exam-badge">Upcoming</span>
                        </div>
                        <p className="exam-subject">{exam.subject}</p>
                        <p className="exam-description">{exam.description}</p>
                        <div className="exam-details">
                          <span>Starts: {startTime.toLocaleDateString()} {startTime.toLocaleTimeString()}</span>
                          <span>Duration: {exam.durationMinutes} min</span>
                          <span>Questions: {exam.totalQuestions}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section className="exam-section past-exams">
                <h2>Past Exams</h2>
                <div className="exam-grid">
                  {past.map(exam => {
                    const session = getSessionForExam(exam.id);
                    return (
                      <div key={exam.id} className="exam-card">
                        <div className="exam-header">
                          <h3>{exam.name}</h3>
                          <span className="exam-badge">Closed</span>
                        </div>
                        <p className="exam-subject">{exam.subject}</p>
                        {session && (
                          <>
                            <div className="exam-score">
                              <strong>Score: {session.score}/{session.answers.length}</strong>
                              <span className={`percentage ${session.percentage >= 50 ? 'pass' : 'fail'}`}>
                                {session.percentage}%
                              </span>
                            </div>
                            <button 
                              className="exam-review-btn"
                              onClick={() => handleReviewResults(session.id)}
                            >
                              View Results
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {exams.length === 0 && (
              <div className="no-exams">
                <p>No exams available yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

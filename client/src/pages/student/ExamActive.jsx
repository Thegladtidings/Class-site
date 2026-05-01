import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { useData } from '../../contexts/DataContext';
import '../../css/exam.css';

export default function StudentExamActive() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { getExamById, getExamQuestions, saveExamAnswer, submitExam, createExamSession } = useData();
  
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [session, setSession] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  // Initialize exam session and load data
  useEffect(() => {
    const loadExam = async () => {
      try {
        let sessionData = sessionStorage.getItem('active_exam_session');
        let examSession;

        if (!sessionData) {
          // Create new session if doesn't exist
          const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null;
          examSession = await createExamSession(examId, userId);
          
          sessionStorage.setItem('active_exam_session', JSON.stringify({
            sessionId: examSession.id,
            examId,
            startTime: new Date(),
            endTime: new Date(Date.now() + 120 * 60 * 1000),
          }));
        } else {
          const stored = JSON.parse(sessionData);
          examSession = { id: stored.sessionId };
        }

        const examData = getExamById(examId);
        const questionsData = getExamQuestions(examId);

        setExam(examData);
        setQuestions(questionsData);
        setSession(examSession);
      } catch (error) {
        console.error('Error loading exam:', error);
      } finally {
        setLoading(false);
      }
    };

    loadExam();
  }, [examId]);

  // Timer effect
  useEffect(() => {
    if (!session) return;

    const sessionData = JSON.parse(sessionStorage.getItem('active_exam_session') || '{}');
    const endTime = new Date(sessionData.endTime).getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const remaining = endTime - now;

      if (remaining <= 0) {
        clearInterval(timer);
        handleSubmitExam();
      } else {
        setTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [session]);

  // Warn before leaving during exam
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const currentQuestion = questions[currentQuestionIndex];

  const handleSelectAnswer = (option) => {
    const newAnswers = { ...answers, [currentQuestion.id]: option };
    setAnswers(newAnswers);
    saveExamAnswer(session.id, currentQuestion.id, option);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitExam = async () => {
    try {
      const result = await submitExam(session.id);
      sessionStorage.removeItem('active_exam_session');
      navigate(`/student/exam-results/${session.id}`);
    } catch (error) {
      console.error('Error submitting exam:', error);
    }
  };

  if (loading || !exam || !session) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <Navbar title={`${exam?.name || 'Exam'}`} />
          <div className="content">
            <div className="loading">Loading exam...</div>
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = ((currentQuestionIndex + 1) / questions.length) * 100;
  const formatTime = (ms) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((ms % (1000 * 60)) / 1000);
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title={exam.name} />
        <div className="content">
          <div className="exam-container">
            <div className="exam-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
              </div>
              <div className="progress-text">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
            </div>

            <div className="exam-question">
              <div className="question-number">Question {currentQuestionIndex + 1}</div>
              <div className="question-text">{currentQuestion.questionText}</div>

              <div className="question-options">
                {Object.entries(currentQuestion.options).map(([option, text]) => (
                  <label key={option} className="option-label">
                    <input
                      type="radio"
                      name="answer"
                      value={option}
                      checked={answers[currentQuestion.id] === option}
                      onChange={() => handleSelectAnswer(option)}
                    />
                    <span className="option-text">
                      <strong>{option}.</strong> {text}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="exam-navigation">
              <button 
                className="nav-btn"
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </button>

              <div className="nav-center">
                {timeRemaining && <span className="time-display">{formatTime(timeRemaining)}</span>}
              </div>

              {currentQuestionIndex === questions.length - 1 ? (
                <button 
                  className="nav-btn submit-btn"
                  onClick={() => setShowConfirmSubmit(true)}
                >
                  Submit Exam
                </button>
              ) : (
                <button 
                  className="nav-btn"
                  onClick={handleNextQuestion}
                >
                  Next
                </button>
              )}
            </div>

            {showConfirmSubmit && (
              <div className="modal-overlay" onClick={() => setShowConfirmSubmit(false)}>
                <div className="modal md" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2>Confirm Submission</h2>
                  </div>
                  <div className="modal-body">
                    <p>Are you sure you want to submit your exam?</p>
                    <p>You have answered {Object.keys(answers).length} out of {questions.length} questions.</p>
                  </div>
                  <div className="modal-actions">
                    <button 
                      className="btn secondary"
                      onClick={() => setShowConfirmSubmit(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn primary"
                      onClick={handleSubmitExam}
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { useData } from '../../contexts/DataContext';

export default function StudentExamResults() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { getExamSession, getExamById, getExamQuestions } = useData();
  
  const [session, setSession] = useState(null);
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResults = async () => {
      try {
        const sessionData = getExamSession(sessionId);
        if (sessionData) {
          const examData = getExamById(sessionData.examId);
          const questionsData = getExamQuestions(sessionData.examId);
          
          setSession(sessionData);
          setExam(examData);
          setQuestions(questionsData);
        }
      } catch (error) {
        console.error('Error loading results:', error);
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [sessionId]);

  if (loading || !session) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <Navbar title="Exam Results" />
          <div className="content">
            <div className="loading">Loading results...</div>
          </div>
        </div>
      </div>
    );
  }

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'excellent';
    if (percentage >= 70) return 'good';
    if (percentage >= 60) return 'average';
    return 'poor';
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Exam Results" />
        <div className="content">
          <div className="results-container">
            <div className={`result-score-circle ${getScoreColor(session.percentage)}`}>
              <div className="score-percentage">{session.percentage}%</div>
              <div className="score-label">
                {session.percentage >= 50 ? 'PASSED' : 'FAILED'}
              </div>
            </div>

            <div className="result-summary">
              <h2>{exam.name}</h2>
              <div className="summary-stats">
                <div className="stat">
                  <span className="stat-label">Total Questions</span>
                  <span className="stat-value">{questions.length}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Correct Answers</span>
                  <span className="stat-value" style={{ color: '#27ae60' }}>{session.score}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Incorrect Answers</span>
                  <span className="stat-value" style={{ color: '#e74c3c' }}>{questions.length - session.score}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Score</span>
                  <span className="stat-value">{session.score}/{questions.length}</span>
                </div>
              </div>
            </div>

            <div className="result-answers-review">
              <h3>Answer Review</h3>
              <table className="answers-table">
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Your Answer</th>
                    <th>Correct Answer</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((question, index) => {
                    const studentAnswer = session.answers.find(a => a.questionId === question.id);
                    const isCorrect = studentAnswer?.selectedAnswer === question.correctAnswer;
                    
                    return (
                      <tr key={question.id} className={isCorrect ? 'correct' : 'incorrect'}>
                        <td className="question-col">
                          <strong>{index + 1}.</strong> {question.questionText}
                        </td>
                        <td>
                          {studentAnswer ? `${studentAnswer.selectedAnswer}. ${question.options[studentAnswer.selectedAnswer]}` : 'Not answered'}
                        </td>
                        <td>
                          {question.correctAnswer}. {question.options[question.correctAnswer]}
                        </td>
                        <td className={isCorrect ? 'correct' : 'incorrect'}>
                          {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="result-actions">
              <button 
                className="btn primary"
                onClick={() => navigate('/student/exams')}
              >
                Back to Exams
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

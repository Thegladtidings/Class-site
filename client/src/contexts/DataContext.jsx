import React, { createContext, useCallback, useRef } from 'react';
import * as mockData from '../utils/mockData';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const dataCache = useRef({});

  // Grades
  const getGrades = useCallback((studentId) => {
    return mockData.getGrades(studentId);
  }, []);

  const addGrade = useCallback((gradeData) => {
    return mockData.addGrade(gradeData);
  }, []);

  // Assignments
  const getAssignments = useCallback(() => {
    return mockData.getAssignments();
  }, []);

  const getStudentAssignments = useCallback((studentId) => {
    return mockData.getStudentAssignments(studentId);
  }, []);

  const addAssignment = useCallback((assignmentData) => {
    return mockData.addAssignment(assignmentData);
  }, []);

  const submitAssignment = useCallback((assignmentId, studentId, submissionData) => {
    return mockData.submitAssignment(assignmentId, studentId, submissionData);
  }, []);

  // Announcements
  const getAnnouncements = useCallback(() => {
    return mockData.getAnnouncements();
  }, []);

  const addAnnouncement = useCallback((announcementData) => {
    return mockData.addAnnouncement(announcementData);
  }, []);

  // Exams
  const getExams = useCallback(() => {
    return mockData.getExams();
  }, []);

  const getExamById = useCallback((examId) => {
    return mockData.getExamById(examId);
  }, []);

  const getExamQuestions = useCallback((examId) => {
    return mockData.getExamQuestions(examId);
  }, []);

  const createExamSession = useCallback((examId, studentId) => {
    return mockData.createExamSession(examId, studentId);
  }, []);

  const saveExamAnswer = useCallback((sessionId, questionId, selectedAnswer) => {
    mockData.saveExamAnswer(sessionId, questionId, selectedAnswer);
  }, []);

  const submitExam = useCallback((sessionId) => {
    return mockData.submitExam(sessionId);
  }, []);

  const getExamSession = useCallback((sessionId) => {
    return mockData.getExamSession(sessionId);
  }, []);

  const getStudentExamSessions = useCallback((studentId) => {
    return mockData.getStudentExamSessions(studentId);
  }, []);

  // Students
  const getStudents = useCallback(() => {
    return mockData.getStudents();
  }, []);

  const getStudentById = useCallback((studentId) => {
    return mockData.getStudentById(studentId);
  }, []);

  const updateStudent = useCallback((studentId, updates) => {
    return mockData.updateStudent(studentId, updates);
  }, []);

  const value = {
    // Grades
    getGrades,
    addGrade,
    // Assignments
    getAssignments,
    getStudentAssignments,
    addAssignment,
    submitAssignment,
    // Announcements
    getAnnouncements,
    addAnnouncement,
    // Exams
    getExams,
    getExamById,
    getExamQuestions,
    createExamSession,
    saveExamAnswer,
    submitExam,
    getExamSession,
    getStudentExamSessions,
    // Students
    getStudents,
    getStudentById,
    updateStudent,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = React.useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};

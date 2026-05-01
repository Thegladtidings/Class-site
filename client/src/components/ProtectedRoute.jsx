import React from 'react';
import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children, requiredRole = null }) => {

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (!token) {
    return <Navigate to="/login" replace />;
  } else if (requiredRole && role !== requiredRole) {
    return <Navigate to="/login" replace />;
  } 
  
  return children;
};

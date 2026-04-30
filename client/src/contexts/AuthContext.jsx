import React, { createContext, useReducer, useCallback, useEffect } from 'react';
import { storage } from '../utils/storage';

export const AuthContext = createContext();

const initialState = {
  user: null,
  token: null,
  role: null,
  isAuthenticated: false,
  loading: true,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        role: action.payload.role,
        isAuthenticated: true,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        role: null,
        isAuthenticated: false,
      };
    case 'RESTORE_TOKEN':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        role: action.payload.role,
        isAuthenticated: !!action.payload.token,
        loading: false,
      };
    case 'LOADING_COMPLETE':
      return {
        ...state,
        loading: false,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore auth on mount
  useEffect(() => {
    const bootstrapAsync = async () => {
      const token = storage.get('jss_auth_token');
      const userId = storage.get('jss_user_id');
      const userRole = storage.get('jss_user_role');
      
      if (token && userId) {
        // Get user data from mock data
        const allUsers = storage.get('jss_users') || [];
        const user = allUsers.find(u => u.id === userId);
        
        if (user) {
          dispatch({
            type: 'RESTORE_TOKEN',
            payload: { token, user, role: userRole },
          });
        } else {
          dispatch({ type: 'LOADING_COMPLETE' });
        }
      } else {
        dispatch({ type: 'LOADING_COMPLETE' });
      }
    };

    bootstrapAsync();
  }, []);

  const login = useCallback(async (email, password, role) => {
    // Mock login validation
    const allUsers = storage.get('jss_users') || [];
    const user = allUsers.find(u => u.email === email && u.role === role);
    
    if (user) {
      const token = 'jss_token_' + Date.now();
      storage.set('jss_auth_token', token);
      storage.set('jss_user_id', user.id);
      storage.set('jss_user_role', role);

      dispatch({
        type: 'LOGIN',
        payload: { user, token, role },
      });
      return { success: true };
    }
    
    return { success: false, error: 'Invalid credentials' };
  }, []);

  const logout = useCallback(() => {
    storage.remove('jss_auth_token');
    storage.remove('jss_user_id');
    storage.remove('jss_user_role');
    dispatch({ type: 'LOGOUT' });
  }, []);

  const value = {
    state,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize token from localStorage
  const [token, setToken] = useState(localStorage.getItem('token'));



  const fetchMe = async (force = false) => {
    if (!token) {
      setLoading(false);
      return;
    }

    // If we already have a user and aren't forcing a refresh, skip the network call
    if (user && !force) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get('/api/auth/me');
      setUser(res.data.user);
    } catch (err) {
      console.error('Failed to fetch user:', err);
      // Only logout if it's a 401/403 or other critical error
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    if (token) {
      fetchMe();
    } else {
      setLoading(false);
    }
  }, [token]);

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

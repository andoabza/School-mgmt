import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useUser } from './userContext.jsx';
import axios from 'axios';
import { loginUser } from '../utils/authenticator.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { setUser } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && !error.config._retry) {
          error.config._retry = true;
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          navigate('/login');
          toast.error('Session expired. Please login again.');
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [navigate, setUser]);

  const login = async (formData) => {
    setError(null);
    try {
      const data = await loginUser(formData);

      if (!data?.token) {
        throw new Error('Authentication failed: No token received');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      setUser(data.user);

      // Redirect to dashboard or intended path
      const redirectPath = location.state?.from?.pathname || '/dashboard';
      navigate(redirectPath);

      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message ||
                         error.message ||
                         'Login failed. Please try again.';
      setError(errorMessage);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    navigate('/login');
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
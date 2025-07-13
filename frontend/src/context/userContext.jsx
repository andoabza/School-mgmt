import { createContext, useContext, useState, useEffect } from 'react';
import api from '../axiosConfig';
const UserContext = createContext();
import { useNavigate, useLocation } from 'react-router-dom';
import { getUser } from '../utils/authenticator.js';
// import { toast } from 'react-toastify';

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadUser();
  }, []);

const loadUser = async () => {
        try {
        const token = await localStorage.getItem('token');
        const user = await localStorage.getItem('user');
        if (token) {
          setUser(user);
          const response = await getUser();
          setUser(response);
          navigate(location.pathname);
          }  
        } catch (error) {
          console.log(error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          }
    };
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
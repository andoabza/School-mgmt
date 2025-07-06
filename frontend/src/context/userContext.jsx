import { createContext, useContext, useState, useEffect } from 'react';
import api from '../axiosConfig';
const UserContext = createContext();
import { useNavigate } from 'react-router-dom';
// import { toast } from 'react-toastify';

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

const loadUser = async () => {
        try {
        const token = await localStorage.getItem('token');

        if (token) {
            const response = await api.get('/auth/me');
            if (response.status == 200) {
              setUser(response.data);
              localStorage.setItem('user', JSON.stringify(response.data));
            }}
        } catch (error) {
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
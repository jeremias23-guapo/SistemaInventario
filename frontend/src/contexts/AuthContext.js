// src/contexts/AuthContext.js
import { createContext, useState, useEffect } from 'react';
import { login as apiLogin } from '../api/usuarios';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [token, setToken]   = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      // podrías decodificar el JWT para extraer user, o almacenarlo en localStorage
      const storedUser = JSON.parse(localStorage.getItem('user'));
      setUser(storedUser);
    }
  }, [token]);

  const login = async (credentials) => {
    const { token: t, user: u } = await apiLogin(credentials);
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStorageData() {
      const storageUser = localStorage.getItem('@PTAS:user');
      const storageToken = localStorage.getItem('@PTAS:token');

      if (storageUser && storageUser !== 'undefined' && storageToken) {
        try {
          setUser(JSON.parse(storageUser));
        } catch (e) {
          localStorage.removeItem('@PTAS:user');
          localStorage.removeItem('@PTAS:token');
        }
      }
      setLoading(false);
    }

    loadStorageData();
  }, []);

  const signIn = async (email, password) => {
    try {
      const response = await api.post('/utilizadores/login', { email, password });
      const { user, token } = response.data;

      localStorage.setItem('@PTAS:user', JSON.stringify(user));
      localStorage.setItem('@PTAS:token', token);

      setUser(user);
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Erro na autenticação');
    }
  };

  const signOut = () => {
    localStorage.removeItem('@PTAS:token');
    localStorage.removeItem('@PTAS:user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ signed: !!user, user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

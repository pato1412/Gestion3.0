import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un token o sesión guardada
    const token = Cookies.get('authToken');
    const userData = Cookies.get('userData');
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    setIsAuthenticated(true);
    setUser(userData);
    Cookies.set('authToken', token, { expires: 7 }); // Expira en 7 días
    Cookies.set('userData', JSON.stringify(userData), { expires: 7 });
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    Cookies.remove('authToken');
    Cookies.remove('userData');
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
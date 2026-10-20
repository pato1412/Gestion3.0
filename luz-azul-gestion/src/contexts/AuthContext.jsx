import { createContext, useContext, useState } from 'react';
import Cookies from 'js-cookie';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};

// La sesión se lee de las cookies al crear el estado (sin useEffect, así no hay un render extra).
const getUserFromCookies = () => {
  const token = Cookies.get('authToken');
  const userData = Cookies.get('userData');
  return token && userData ? JSON.parse(userData) : null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getUserFromCookies);
  const isAuthenticated = user !== null;
  const loading = false;

  const login = (userData, token) => {
    setUser(userData);
    Cookies.set('authToken', token, { expires: 7 }); // Expira en 7 días
    Cookies.set('userData', JSON.stringify(userData), { expires: 7 });
  };

  const logout = () => {
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
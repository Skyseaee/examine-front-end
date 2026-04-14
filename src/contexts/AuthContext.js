import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    console.log('AuthContext useEffect - token exists:', !!token);
    console.log('AuthContext useEffect - token value:', token);
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        console.log('AuthContext - Full Token payload:', payload);
        console.log('AuthContext - payload.data:', payload.data);
        console.log('AuthContext - uid:', payload.data?.uid, 'privilege:', payload.data?.privilege);
        setUser({
          uid: payload.data?.uid,
          privilege: payload.data?.privilege
        });
      } catch (e) {
        console.error('Failed to parse token:', e);
        localStorage.removeItem('auth_token');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('auth_token', token);
    setUser({
      uid: userData.uid,
      privilege: userData.privilege
    });
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // 初始化时检查本地存储（可选）
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      setUser({
        uid: payload.data.uid,
        privilege: payload.data.privilege
      });
    }
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

  // ✅ 确保 value 包含所有需要的数据和方法
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ 更健壮的 useAuth Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
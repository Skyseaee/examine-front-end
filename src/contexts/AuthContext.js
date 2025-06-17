import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // 初始化时检查本地存储（可选）
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // 这里可以添加验证 token 的逻辑（如 API 验证）
      // 暂时模拟一个用户
      setUser({ uid: 'demo', privilege: 2 });
    }
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    setUser({  // ✅ 只调用一次
      uid: userData.uid,
      privilege: userData.privilege
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
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
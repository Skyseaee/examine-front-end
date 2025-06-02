import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Form, Input, Button, message, Typography } from 'antd';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import './Login.css'; // 或者使用 CSS Modules: import styles from './Login.module.css'

const { Title } = Typography;

function parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      
      // 特别注意：用户数据在 payload.data 中
      return {
        exp: payload.exp,    // 过期时间戳
        iat: payload.iat,    // 签发时间戳
        uid: payload.data.uid,          // 用户ID
        privilege: payload.data.privilege  // 权限等级
      };
    } catch (e) {
      console.error('Failed to parse JWT', e);
      return null;
    }
}

const Login = () => {
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const { login } = useAuth();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await api.post('/host/login', values);
      if (response.data.success) {
        const token = response.data.token;
        const tokenPayload = parseJwt(token);

        localStorage.setItem('auth_token', token);

        login({
          uid: response.data.uid || tokenPayload.uid,
          privilege: response.data.privilege || tokenPayload.privilege
        }, response.data.token);
        history.push('/');
      }
    } catch (error) {
      message.error('登录失败');
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <Form onFinish={onFinish}>
        <Title level={2} className="login-title">系统登录</Title>
        <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
          <Input placeholder="用户名" />
        </Form.Item>
        <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
          <Input.Password placeholder="密码" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            登录
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Login;
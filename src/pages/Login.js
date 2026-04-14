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
      console.log('Parsed JWT payload:', payload);
      return {
        exp: payload.exp,
        iat: payload.iat,
        uid: payload.data?.uid,
        privilege: payload.data?.privilege
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

        console.log(tokenPayload);

        login({
          uid: tokenPayload?.uid || response.data.uid,
          privilege: tokenPayload?.privilege ?? response.data.privilege
        }, response.data.token);

        console.log('Login - calling login with uid:', tokenPayload?.uid || response.data.uid, 'privilege:', tokenPayload?.privilege ?? response.data.privilege);
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
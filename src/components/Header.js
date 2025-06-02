import React from 'react';
import { Layout, Menu, Dropdown, Button } from 'antd';
import { Link, useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Header: AntHeader } = Layout;

const AppHeader = () => {
  const { user, logout } = useAuth();
  const history = useHistory();

  const menu = (
    <Menu>
      <Menu.Item key="logout" onClick={() => {
        logout();
        history.push('/login');
      }}>
        退出登录
      </Menu.Item>
    </Menu>
  );

  return (
    <AntHeader className="app-header">
      <div className="logo" />
      <Menu theme="dark" mode="horizontal" selectedKeys={[history.location.pathname]}>
        {user?.privilege >= 1 && (
          <Menu.Item key="/">
            <Link to="/">一审审核</Link>
          </Menu.Item>
        )}
        {user?.privilege >= 2 && (
          <Menu.Item key="/second-review">
            <Link to="/second-review">二审处理</Link>
          </Menu.Item>
        )}
        {user?.privilege >= 3 && (
          <Menu.Item key="/final-review">
            <Link to="/final-review">终审确认</Link>
          </Menu.Item>
        )}
      </Menu>
      
      <div className="user-info">
        <Dropdown overlay={menu} placement="bottomRight">
          <Button type="text" style={{ color: 'white' }}>
            {user?.uid} (权限等级: {user?.privilege})
          </Button>
        </Dropdown>
      </div>
    </AntHeader>
  );
};

export default AppHeader;
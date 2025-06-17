import React from 'react';
import { Link, useLocation, withRouter } from 'react-router-dom';
import { Layout, Menu, Breadcrumb } from 'antd';
import { 
  AuditOutlined, 
  SafetyCertificateOutlined, 
  FileDoneOutlined,
  LogoutOutlined,
  MacCommandOutlined
} from '@ant-design/icons';
import PropTypes from 'prop-types';

const { Header, Content, Footer } = Layout;

const MainLayout = ({ children, history }) => {
  const location = useLocation();
  
  // 获取当前选中的菜单项
  const getSelectedKey = () => {
    const path = location.pathname.split('/')[1];
    return path || 'home';
  };
  
  // 处理登出
  const handleLogout = () => {
    // 这里添加实际的登出逻辑，如清除token等
    console.log('用户登出');
    history.push('/login');
  };

  // 菜单项配置
  const menuItems = [
    {
      key: 'home',
      icon: <AuditOutlined />,
      label: <Link to="/">一级评审</Link>,
    },
    {
      key: 'second-review',
      icon: <SafetyCertificateOutlined />,
      label: <Link to="/second-review">二级评审</Link>,
    },
    {
      key: 'final-review',
      icon: <FileDoneOutlined />,
      label: <Link to="/final-review">终审</Link>,
    },
    {
      key: 'self-home',
      icon: <MacCommandOutlined />,
      label: <Link to="/self-home">个人中心</Link>,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      style: { float: 'right' },
      onClick: handleLogout,
    },
  ];
  
  // 获取面包屑名称
  const getBreadcrumbName = (key) => {
    const breadcrumbMap = {
      'home': '一级评审',
      'second-review': '二级评审',
      'final-review': '终审',
      'self-home': '个人中心',
    };
    return breadcrumbMap[key] || '';
  };

  return (
    <Layout className="layout" style={{ minHeight: '100vh' }}>
      {/* 头部导航 */}
      <Header style={{ 
        position: 'fixed', 
        zIndex: 1, 
        width: '100%',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div className="logo" style={{ 
          width: '120px',
          height: '31px',
          marginRight: '24px',
          background: 'rgba(255, 255, 255, 0.2)'
        }} />
        
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[getSelectedKey()]}
          style={{ 
            flex: 1,
            minWidth: 0, // 防止挤压退出按钮
            lineHeight: '64px' 
          }}
        >
          {menuItems.map(item => (
            <Menu.Item 
              key={item.key} 
              icon={item.icon}
              style={item.style}
              onClick={item.onClick}
            >
              {item.label}
            </Menu.Item>
          ))}
        </Menu>
      </Header>
      
      {/* 主要内容区域 */}
      <Content style={{ 
        padding: '0 50px', 
        marginTop: 64,
        background: '#fff',
        minHeight: 'calc(100vh - 133px)' // 减去header和footer的高度
      }}>
        <Breadcrumb style={{ margin: '16px 0' }}>
          <Breadcrumb.Item>评审系统</Breadcrumb.Item>
          <Breadcrumb.Item>
            {getBreadcrumbName(getSelectedKey())}
          </Breadcrumb.Item>
        </Breadcrumb>
        
        <div style={{ 
          padding: 24,
          minHeight: 380,
          background: '#fff',
          borderRadius: 4
        }}>
          {children}
        </div>
      </Content>
      
      {/* 页脚 */}
      <Footer style={{ 
        textAlign: 'center',
        backgroundColor: '#f0f2f5'
      }}>
        题目评审系统 ©2025 Contact us by wechat
      </Footer>
    </Layout>
  );
};

// 添加prop类型检查
MainLayout.propTypes = {
  children: PropTypes.node.isRequired,
  history: PropTypes.object.isRequired,
};

export default withRouter(MainLayout);
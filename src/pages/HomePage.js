import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag } from 'antd';
import { AuditOutlined, SafetyCertificateOutlined, FileDoneOutlined, SettingOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

function HomePage() {
  const [stats, setStats] = useState({
    pendingFirstReview: 0,
    pendingSecondReview: 0,
    pendingFinalReview: 0,
    totalExercises: 0
  });
  const [recentExercises, setRecentExercises] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [firstRes, secondRes, finalRes, allRes] = await Promise.allSettled([
        api.get('/examine/first_list'),
        api.get('/examine/second_list'),
        api.get('/examine/final_list'),
        api.get('/exercise/all')
      ]);

      setStats({
        pendingFirstReview: firstRes.status === 'fulfilled' ? (Array.isArray(firstRes.value.data) ? firstRes.value.data.length : 0) : 0,
        pendingSecondReview: secondRes.status === 'fulfilled' ? (Array.isArray(secondRes.value.data) ? secondRes.value.data.length : 0) : 0,
        pendingFinalReview: finalRes.status === 'fulfilled' ? (Array.isArray(finalRes.value.data) ? finalRes.value.data.length : 0) : 0,
        totalExercises: allRes.status === 'fulfilled' ? (Array.isArray(allRes.value.data) ? allRes.value.data.length : 0) : 0
      });

      const recentData = allRes.status === 'fulfilled' && Array.isArray(allRes.value.data) 
        ? allRes.value.data.slice(0, 5) 
        : [];
      setRecentExercises(recentData);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      0: { text: '待审核', color: 'orange' },
      1: { text: '一审通过', color: 'green' },
      2: { text: '二审通过', color: 'blue' },
      3: { text: '终审通过', color: 'purple' },
      4: { text: '已拒绝', color: 'red' }
    };
    const info = statusMap[status] || { text: '未知', color: 'default' };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const dashboardCards = [
    {
      title: '一级审核',
      icon: <AuditOutlined style={{ fontSize: 48, color: '#1890ff' }} />,
      count: stats.pendingFirstReview,
      description: '待审核题目',
      path: '/',
      color: '#e6f7ff'
    },
    {
      title: '二级审核',
      icon: <SafetyCertificateOutlined style={{ fontSize: 48, color: '#52c41a' }} />,
      count: stats.pendingSecondReview,
      description: '待审核题目',
      path: '/second-review',
      color: '#f6ffed'
    },
    {
      title: '终审',
      icon: <FileDoneOutlined style={{ fontSize: 48, color: '#722ed1' }} />,
      count: stats.pendingFinalReview,
      description: '待审核题目',
      path: '/final-review',
      color: '#f9f0ff'
    },
    {
      title: '题目管理',
      icon: <SettingOutlined style={{ fontSize: 48, color: '#fa8c16' }} />,
      count: stats.totalExercises,
      description: '题目总数',
      path: '/admin/exercises',
      color: '#fff7e6'
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>题目审核系统</h1>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {dashboardCards.map((card, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Link to={card.path}>
              <Card
                hoverable
                style={{ backgroundColor: card.color, border: 'none' }}
                bodyStyle={{ padding: 24 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>{card.title}</p>
                    <Statistic 
                      valueStyle={{ fontSize: 32, fontWeight: 'bold' }}
                      value={card.count} 
                      suffix={card.description}
                    />
                  </div>
                  {card.icon}
                </div>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>

      <Card title="最新题目" extra={<Link to="/admin/exercises"><span style={{ color: '#1890ff' }}>查看全部</span></Link>}>
        <Table
          dataSource={recentExercises}
          rowKey="id"
          pagination={false}
          columns={[
            { title: 'ID', dataIndex: 'id', width: 80 },
            { 
              title: '题目内容', 
              dataIndex: 'question',
              ellipsis: true,
              render: (text) => text ? text.substring(0, 50) + '...' : '-'
            },
            { 
              title: '题型', 
              dataIndex: 'exercise_type',
              width: 100,
              render: (type) => {
                const types = ['单选题', '多选题', '判断题'];
                return types[type] || '未知';
              }
            },
            { 
              title: '状态', 
              dataIndex: 'status',
              width: 100,
              render: (status) => getStatusTag(status)
            }
          ]}
        />
      </Card>
    </div>
  );
}

export default HomePage;
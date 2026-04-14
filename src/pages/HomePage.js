import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Modal, Upload, message, Space } from 'antd';
import { AuditOutlined, SafetyCertificateOutlined, FileDoneOutlined, SettingOutlined, UploadOutlined, InboxOutlined, FileZipOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { api, batchUploadExercises } from '../utils/api';

function HomePage() {
  const [stats, setStats] = useState({
    pendingFirstReview: 0,
    pendingSecondReview: 0,
    pendingFinalReview: 0,
    totalExercises: 0
  });
  const [recentExercises, setRecentExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  const handleFileUpload = async (file) => {
    if (!file) return false;

    if (!file.name.endsWith('.zip')) {
      message.error('只能上传 ZIP 格式文件！');
      return false;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await batchUploadExercises(formData);
      if (response.data.code === 200) {
        const { success_count, failed_count } = response.data.data;
        message.success(`上传完成！成功 ${success_count} 条，失败 ${failed_count} 条`);
        setUploadModalVisible(false);
        loadDashboardData();
      } else {
        message.error(response.data.msg || '上传失败！');
      }
    } catch (error) {
      console.error('上传失败:', error);
      message.error('上传失败: ' + (error.response?.data?.msg || error.message));
    } finally {
      setUploading(false);
    }

    return false;
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    showUploadList: false,
    beforeUpload: handleFileUpload,
    disabled: uploading
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>题目审核系统</h1>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          onClick={() => setUploadModalVisible(true)}
        >
          批量上传题目
        </Button>
      </div>

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

      <Modal
        title="批量上传题目"
        open={uploadModalVisible}
        onCancel={() => !uploading && setUploadModalVisible(false)}
        footer={null}
        width={600}
        maskClosable={!uploading}
        closable={!uploading}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Upload.Dragger {...uploadProps} style={{ padding: '40px 20px' }}>
            <p className="ant-upload-drag-icon">
              <FileZipOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            </p>
            <p className="ant-upload-text">点击或拖拽 ZIP 文件上传</p>
            <p className="ant-upload-hint">支持 ZIP 格式的题目批量导入（包含 questions.json 和图片）</p>
          </Upload.Dragger>

          {uploading && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Button type="primary" loading>上传中...</Button>
            </div>
          )}

          <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 4 }}>
            <h4 style={{ marginBottom: 8 }}>ZIP 包格式要求:</h4>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#666' }}>
              <li>ZIP 包内必须包含 <code>questions.json</code> 文件</li>
              <li>如有图片，需在 ZIP 包内创建 <code>images/</code> 文件夹存放</li>
              <li>questions.json 格式为数组，每个元素包含题目信息</li>
              <li>仅限权限等级 3（管理员）上传</li>
            </ul>
          </div>

          <div style={{ background: '#fff7e6', padding: 16, borderRadius: 4 }}>
            <h4 style={{ marginBottom: 8 }}>questions.json 示例:</h4>
            <pre style={{ margin: 0, fontSize: 12, color: '#666', whiteSpace: 'pre-wrap' }}>
{`[
  {
    "question": "题目内容",
    "option_a": "A选项",
    "option_b": "B选项", 
    "option_c": "C选项",
    "option_d": "D选项",
    "answer": "A",
    "explanation": "解析内容",
    "exercise_type": 0,
    "first_id": 1,
    "question_img": "图片文件名",
    "comment_img": "解析图片文件名"
  }
]`}
            </pre>
          </div>
        </Space>
      </Modal>
    </div>
  );
}

export default HomePage;
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Modal, Upload, message, Space } from 'antd';
import { AuditOutlined, SafetyCertificateOutlined, FileDoneOutlined, SettingOutlined, UploadOutlined, DownloadOutlined, InboxOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { api, batchUploadExercises } from '../utils/api';
import Papa from 'papaparse';

const { Dragger } = Upload;

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
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

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

  const handleDownloadTemplate = () => {
    const template = [
      {
        question: '示例题目内容',
        option_a: 'A选项',
        option_b: 'B选项',
        option_c: 'C选项',
        option_d: 'D选项',
        answer: 'A',
        explanation: '这是解析内容',
        exercise_type: 0,
        first_id: 1
      }
    ];
    const csv = Papa.unparse(template);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '题目导入模板.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleFileUpload = async (file) => {
    if (!file) return false;

    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/octet-stream'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      message.error('只能上传 CSV 文件！');
      return false;
    }

    setUploading(true);
    setUploadProgress({ current: 0, total: 0 });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data;
        if (data.length === 0) {
          message.error('CSV 文件为空或格式不正确！');
          setUploading(false);
          return;
        }

        setUploadProgress({ current: 0, total: data.length });
        const formData = new FormData();
        formData.append('file', file);

        try {
          const response = await batchUploadExercises(formData);
          if (response.data.success) {
            message.success(`成功上传 ${data.length} 道题目！`);
            setUploadModalVisible(false);
            loadDashboardData();
          } else {
            message.error(response.data.message || '上传失败！');
          }
        } catch (error) {
          console.error('上传失败:', error);
          message.error('上传失败: ' + (error.response?.data?.message || error.message));
        } finally {
          setUploading(false);
          setUploadProgress({ current: 0, total: 0 });
        }
      },
      error: (error) => {
        message.error('解析 CSV 文件失败: ' + error.message);
        setUploading(false);
      }
    });

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
          <Dragger {...uploadProps} style={{ padding: '40px 20px' }}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            </p>
            <p className="ant-upload-text">点击或拖拽 CSV 文件上传</p>
            <p className="ant-upload-hint">支持 CSV 格式的题目批量导入</p>
          </Dragger>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleDownloadTemplate}
            >
              下载导入模板
            </Button>
            {uploading && uploadProgress.total > 0 && (
              <span>正在上传: {uploadProgress.current}/{uploadProgress.total}</span>
            )}
          </div>

          <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 4 }}>
            <h4 style={{ marginBottom: 8 }}>CSV 格式要求:</h4>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#666' }}>
              <li>必须包含表头行</li>
              <li>必填字段: question(题目内容), answer(答案), exercise_type(题型), first_id(科目ID)</li>
              <li>可选字段: option_a, option_b, option_c, option_d, explanation</li>
              <li>题型说明: 0=单选题, 1=多选题, 2=判断题</li>
            </ul>
          </div>
        </Space>
      </Modal>
    </div>
  );
}

export default HomePage;
import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { 
  Card, 
  Tabs, 
  Table, 
  Button, 
  Modal, 
  Upload, 
  message, 
  Tag, 
  Typography,
  Descriptions,
  Avatar,
  Divider,
} from 'antd';
import { 
  UploadOutlined, 
  UserOutlined,
  SolutionOutlined,
  BookOutlined,
  HistoryOutlined,
  FileZipOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const { TabPane } = Tabs;
const { Title, Text } = Typography;

const ProfilePage = () => {
  const history = useHistory();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [reviewRecords, setReviewRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);

  // 获取审核记录
  const fetchReviewRecords = async () => {
    try {
      setLoading(true);
      const response = await api.get('/examine/get_user_examine_record', { 
        params: { uid: user.uid } 
      });
      
      if (response.data.success) {
        setReviewRecords(response.data.records);
      } else {
        setReviewRecords([]);
      }
    } catch (error) {
      message.error('获取审核记录失败');
      setReviewRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // 处理ZIP文件上传
  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error('请先上传ZIP文件');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', fileList[0]);
      
      const endpoint = activeTab === 'direct-upload' 
        ? '/exercise/batch-upload-zip' 
        : '/exercise/batch-submit-zip-for-review';

      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        message.success(
          activeTab === 'direct-upload' 
            ? `成功批量添加 ${response.data.count} 道题目到题库` 
            : `成功批量提交 ${response.data.count} 道题目审核`
        );
        setIsUploadModalVisible(false);
        setFileList([]);
      }
    } catch (error) {
      message.error('提交失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 上传文件处理
  const uploadProps = {
    onRemove: () => {
      setFileList([]);
    },
    beforeUpload: (file) => {
      // 检查是否为ZIP文件
      const isZip = file.type === 'application/zip' || 
                   file.type === 'application/x-zip-compressed' || 
                   file.name.endsWith('.zip');
      
      if (!isZip) {
        message.error('只能上传ZIP格式的文件');
        return false;
      }
      
      // 只允许上传一个文件
      if (fileList.length > 0) {
        message.warning('每次只能上传一个ZIP文件');
        return false;
      }
      
      setFileList([file]);
      return false; // 手动处理上传
    },
    fileList,
    accept: '.zip',
  };

  // 审核记录表格列定义
  const reviewColumns = [
    {
      title: '题目ID',
      dataIndex: 'exercise_id',
      key: 'questionId',
    },
    {
      title: '题目名称',
      dataIndex: 'question',
      key: 'title',
    },
    {
      title: '评审类型',
      dataIndex: 'is_first_round',
      key: 'is_first_round',
      render: (is_first_round) => (
        <Tag color={is_first_round === 1 ? 'green' : 'blue'}>
          {is_first_round === 1 ? '一轮审核'  : '二轮审核'}
        </Tag>
      ),
    },
    {
        title: '状态',
        dataIndex: 'valid',
        key: 'valid',
        render: (valid) => (
          <Tag color={valid === 1 ? 'green' : 'red'}>
            {valid === 1 ? '通过'  : '驳回'}
          </Tag>
        ),
    },
    {
      title: '评审时间',
      dataIndex: 'examine_time',
      key: 'examine_time',
      render: (time) => time ? moment(time).format('YYYY-MM-DD HH:mm:ss') : '-'
    },
    {
      title: '评审意见',
      dataIndex: 'comment',
      key: 'comment',
    },
  ];

  useEffect(() => {
    if (activeTab === 'reviews') {
      fetchReviewRecords();
    }
  }, [activeTab]);

  return (
    <div className="profile-container">
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* 个人信息标签页 */}
          <TabPane
            tab={
              <span>
                <UserOutlined />
                个人信息
              </span>
            }
            key="profile"
          >
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Avatar size={120} icon={<UserOutlined />} />
                <Title level={3} style={{ marginTop: 16 }}>
                  {user?.username || '未命名用户'}
                </Title>
              </div>

              <Descriptions bordered column={1}>
                <Descriptions.Item label="用户ID">{user?.uid}</Descriptions.Item>
                <Descriptions.Item label="权限级别">
                  <Tag color={user?.privilege === 3 ? 'red' : 'blue'}>
                    {user?.privilege === 3 ? '管理员' : '普通用户'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="注册时间">
                  {user?.registerTime || '未知'}
                </Descriptions.Item>
                <Descriptions.Item label="最后登录">
                  {user?.lastLogin || '未知'}
                </Descriptions.Item>
              </Descriptions>

              <Divider />

              <Button 
                type="primary" 
                danger
                onClick={() => {
                  logout();
                  history.push('/login');
                }}
              >
                退出登录
              </Button>
            </div>
          </TabPane>

          {/* 审核记录标签页 */}
          <TabPane
            tab={
              <span>
                <HistoryOutlined />
                我的审核记录
              </span>
            }
            key="reviews"
          >
            <Table 
              columns={reviewColumns} 
              dataSource={reviewRecords} 
              loading={loading}
              rowKey="questionId"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          {/* 提交题目标签页 */}
          <TabPane
            tab={
              <span>
                <SolutionOutlined />
                提交题目
              </span>
            }
            key="submit"
          >
            <Card>
              <Button 
                type="primary" 
                icon={<FileZipOutlined />}
                onClick={() => setIsUploadModalVisible(true)}
                style={{ marginBottom: 16 }}
              >
                上传ZIP文件
              </Button>
              <Text type="secondary">
                请上传包含题目的ZIP压缩包，系统将自动解析并提交审核
              </Text>
            </Card>
          </TabPane>

          {/* 直接入库标签页（仅管理员可见） */}
          {user?.privilege === 'admin' && (
            <TabPane
              tab={
                <span>
                  <BookOutlined />
                  直接入库
                </span>
              }
              key="direct-upload"
            >
              <Card>
                <Button 
                  type="primary" 
                  icon={<FileZipOutlined />}
                  onClick={() => setIsUploadModalVisible(true)}
                  style={{ marginBottom: 16 }}
                >
                  直接上传ZIP文件
                </Button>
                <Text type="warning">
                  警告：您拥有管理员权限，可以直接将ZIP包中的题目加入正式题库，请谨慎操作
                </Text>
              </Card>
            </TabPane>
          )}
        </Tabs>
      </Card>

      {/* 上传ZIP文件模态框 */}
      <Modal
        title={activeTab === 'direct-upload' ? '直接上传ZIP文件到题库' : '提交ZIP文件审核'}
        visible={isUploadModalVisible}
        onCancel={() => {
          setIsUploadModalVisible(false);
          setFileList([]);
        }}
        onOk={handleUpload}
        confirmLoading={loading}
        okText={activeTab === 'direct-upload' ? '直接上传到题库' : '提交审核'}
        cancelText="取消"
        width={600}
        destroyOnClose
      >
        <div style={{ padding: '20px 0' }}>
          <Upload.Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <FileZipOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
            </p>
            <p className="ant-upload-text">点击或拖拽ZIP文件到此处</p>
            <p className="ant-upload-hint">
              请上传包含题目的ZIP压缩包，系统将自动解析文件内容
              <br />
              支持的最大文件大小: 50MB
            </p>
          </Upload.Dragger>
          
          {fileList.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Text strong>已选择文件：</Text>
              <Text>{fileList[0].name}</Text>
              <br />
              <Text type="secondary">文件大小：{(fileList[0].size / 1024 / 1024).toFixed(2)} MB</Text>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ProfilePage;
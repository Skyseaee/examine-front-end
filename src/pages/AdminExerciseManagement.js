import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, message, Popconfirm } from 'antd';
import { searchExercisesAdmin, updateExerciseAdmin, deleteExerciseAdmin } from '../utils/api';

const { Option } = Select;
const { TextArea } = Input;

const AdminExerciseManagement = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const response = await searchExercisesAdmin({
        page: params.current || pagination.current,
        per_page: params.pageSize || pagination.pageSize,
        ...searchForm.getFieldsValue(),
      });
      if (response.data.success) {
        // 确保数据是数组，如果不是则设置为空数组
        const items = Array.isArray(response.data.data.items) ? response.data.data.items : [];
        setData(items);
        setPagination({
          ...pagination,
          current: response.data.data.current_page,
          total: response.data.data.total,
        });
      } else {
        message.error('Failed to fetch data');
        setData([]); // 失败时设置为空数组
      }
    } catch (error) {
      message.error('Error fetching data: ' + error.message);
      setData([]); // 出错时也设置为空数组
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTableChange = (pagination) => {
    fetchData({ current: pagination.current, pageSize: pagination.pageSize });
  };

  const onSearch = () => {
    setPagination({ ...pagination, current: 1 });
    fetchData({ current: 1 });
  };

  const handleDelete = async (id) => {
    try {
      const response = await deleteExerciseAdmin(id);
      if (response.data.success) {
        message.success('Deleted successfully');
        fetchData();
      } else {
        message.error('Delete failed');
      }
    } catch (error) {
      message.error('Error deleting: ' + error.message);
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      const response = await updateExerciseAdmin(editingRecord.id, values);
      if (response.data.success) {
        message.success('Updated successfully');
        setIsModalVisible(false);
        fetchData();
      } else {
        message.error('Update failed');
      }
    } catch (error) {
      message.error('Error updating: ' + error.message);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      fixed: 'left',
    },
    {
      title: '科目序号',
      dataIndex: 'first_id',
      key: 'first_id',
      width: 100,
    },
    {
      title: '题目内容',
      dataIndex: 'question',
      key: 'question',
      ellipsis: true,
      width: 300,
    },
    {
      title: '题目难度',
      dataIndex: 'exercise_type',
      key: 'exercise_type',
      width: 130,
      render: (type) => {
        const types = { 
          0: '基础阶段', 1: '基础阶段', 3: '基础阶段',
          4: '强化阶段',
          5: '冲刺阶段',
          6: '真题阶段',
          10: '全程班专属', 11: '全程班专属', 12: '全程班专属', 13: '全程班专属', 14: '全程班专属'
        };
        return types[type] || type;
      },
    },
    {
      title: '删除状态',
      dataIndex: 'is_del',
      key: 'is_del',
      width: 100,
      render: (is_del) => (
        <span style={{ color: is_del ? 'red' : 'green' }}>
          {is_del ? '已删除' : '未删除'}
        </span>
      ),
    },
    {
      title: '审核状态',
      dataIndex: 'examine',
      key: 'examine',
      width: 120,
      render: (examine) => (
        <span style={{ color: examine === 1 ? 'orange' : 'green' }}>
          {examine === 0 ? '已审核' : '待审核'}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定要删除吗？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Form form={searchForm} layout="vertical" style={{ marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <Form.Item name="id" label="题目ID">
            <Input placeholder="Enter ID" type="number" />
          </Form.Item>
          <Form.Item name="first_id" label="科目序号">
            <Select placeholder="选择科目" allowClear>
              <Option value={12}>12-操作系统</Option>
              <Option value={13}>13-计算机网络</Option>
              <Option value={14}>14-数据结构</Option>
              <Option value={15}>15-计算机组成原理</Option>
            </Select>
          </Form.Item>
          <Form.Item name="question" label="题目内容 (模糊搜索)">
            <Input placeholder="Search by question content" />
          </Form.Item>
          <Form.Item name="exercise_type" label="题目难度">
            <Select placeholder="Select Type" allowClear>
              <Option value={0}>基础阶段-0</Option>
              <Option value={1}>基础阶段-1</Option>
              <Option value={3}>基础阶段-3</Option>
              <Option value={4}>强化阶段</Option>
              <Option value={5}>冲刺阶段</Option>
              <Option value={6}>真题阶段</Option>
              <Option value={10}>全程班专属-10</Option>
              <Option value={11}>全程班专属-11</Option>
              <Option value={12}>全程班专属-12</Option>
              <Option value={13}>全程班专属-13</Option>
              <Option value={14}>全程班专属-14</Option>
            </Select>
          </Form.Item>
          <Form.Item name="is_del" label="删除状态">
            <Select placeholder="Select Status" allowClear>
              <Option value={0}>未删除</Option>
              <Option value={1}>已删除</Option>
            </Select>
          </Form.Item>
          <Form.Item name="examine" label="审核状态">
            <Select placeholder="Select Status" allowClear>
              <Option value={0}>已审核</Option>
              <Option value={1}>待审核</Option>
            </Select>
          </Form.Item>
        </div>
        <Form.Item>
          <Space>
            <Button type="primary" onClick={onSearch}>搜索</Button>
            <Button onClick={() => { searchForm.resetFields(); onSearch(); }}>重置</Button>
          </Space>
        </Form.Item>
      </Form>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
        scroll={{ x: 1200 }}
      />

      <Modal
        title="编辑题目"
        visible={isModalVisible}
        onOk={handleUpdate}
        onCancel={() => setIsModalVisible(false)}
        width={900}
      >
        <Form form={form} layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item name="first_id" label="科目序号">
              <Select placeholder="选择科目">
                <Option value={12}>12-操作系统</Option>
                <Option value={13}>13-计算机网络</Option>
                <Option value={14}>14-数据结构</Option>
                <Option value={15}>15-计算机组成原理</Option>
              </Select>
            </Form.Item>
            <Form.Item name="exercise_type" label="题目难度">
              <Select>
                <Option value={0}>基础阶段-0</Option>
                <Option value={1}>基础阶段-1</Option>
                <Option value={3}>基础阶段-3</Option>
                <Option value={4}>强化阶段</Option>
                <Option value={5}>冲刺阶段</Option>
                <Option value={6}>真题阶段</Option>
                <Option value={10}>全程班专属-10</Option>
                <Option value={11}>全程班专属-11</Option>
                <Option value={12}>全程班专属-12</Option>
                <Option value={13}>全程班专属-13</Option>
                <Option value={14}>全程班专属-14</Option>
              </Select>
            </Form.Item>
          </div>
          <Form.Item name="question" label="题目内容" rules={[{ required: true }]}>
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item name="options" label="题目选项" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="answer" label="答案" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="comments" label="答案解析">
            <TextArea rows={4} />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item name="is_del" label="删除状态">
              <Select>
                <Option value={0}>未删除</Option>
                <Option value={1}>已删除</Option>
              </Select>
            </Form.Item>
            <Form.Item name="examine" label="审核状态">
              <Select>
                <Option value={0}>已审核</Option>
                <Option value={1}>待审核</Option>
              </Select>
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminExerciseManagement;

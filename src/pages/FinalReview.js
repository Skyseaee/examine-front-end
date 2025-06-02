import React, { useState, useEffect } from 'react';
import { Table, Modal, Tag, Descriptions, Button } from 'antd';
import { api } from '../utils/api';

const FinalReview = () => {
  const [finalExercises, setFinalExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);

  useEffect(() => {
    loadFinalExercises();
  }, []);

  const loadFinalExercises = async () => {
    try {
      const res = await api.get('/examine/get_final_exercises');
      setFinalExercises(res.data);
    } catch (error) {
      console.error('加载终审题目失败:', error);
    }
  };

  const handleFinalDecision = async (isApproved) => {
    try {
      await api.post('/examine/insert_final_decision', {
        exercise_id: selectedExercise.id,
        is_approved: isApproved
      });
      setSelectedExercise(null);
      loadFinalExercises();
    } catch (error) {
      console.error('提交终审结果失败:', error);
    }
  };

  return (
    <div>
      <Table
        dataSource={finalExercises}
        rowKey="id"
        columns={[
          { title: '题目ID', dataIndex: 'id' },
          { title: '当前状态', 
            render: (_, record) => (
              <Tag color={record.status === 1 ? 'green' : 'volcano'}>
                {record.status === 1 ? '已通过' : '待处理'}
              </Tag>
            )
          },
          {
            title: '操作',
            render: (_, record) => (
              <Button onClick={() => setSelectedExercise(record)}>终审</Button>
            )
          }
        ]}
      />

      <Modal
        title="终审确认"
        visible={!!selectedExercise}
        width={800}
        onCancel={() => setSelectedExercise(null)}
        footer={[
          <Button key="cancel">取消</Button>,
          <Button 
            key="reject" 
            danger
            onClick={() => handleFinalDecision(false)}
          >
            最终驳回
          </Button>,
          <Button 
            key="approve" 
            type="primary"
            onClick={() => handleFinalDecision(true)}
          >
            最终通过
          </Button>
        ]}
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="题目内容" span={2}>
            {selectedExercise?.question}
          </Descriptions.Item>
          <Descriptions.Item label="一审意见">
            {selectedExercise?.first_comment}
          </Descriptions.Item>
          <Descriptions.Item label="二审意见">
            {selectedExercise?.second_comment}
          </Descriptions.Item>
          <Descriptions.Item label="当前分类">
            {selectedExercise?.current_stage}
          </Descriptions.Item>
          <Descriptions.Item label="调整后分类">
            {selectedExercise?.adjusted_stage}
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    </div>
  );
};

export default FinalReview;
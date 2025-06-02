import React, { useState, useEffect } from 'react';
import { Table, Modal, Form, Input, Button } from 'antd';
import ReviewActions from '../components/ReviewActions';
import { api } from '../utils/api';

const SecondRoundReview = () => {
  const [pendingExercises, setPendingExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [comment, setComment] = useState('');
  const [adjustedStage, setAdjustedStage] = useState(null);

  useEffect(() => {
    loadSecondRoundExercises();
  }, []);

  const loadSecondRoundExercises = async () => {
    try {
      const res = await api.get('/examine/get_second_round_exercises');
      setPendingExercises(res.data);
    } catch (error) {
      console.error('加载二审题目失败:', error);
    }
  };

  const handleSubmit = async (isApproved) => {
    try {
      await api.post('/examine/insert_second_examine_record', {
        exercise_id: selectedExercise.id,
        comment,
        adjusted_stage: adjustedStage,
        is_approved: isApproved
      });
      setSelectedExercise(null);
      loadSecondRoundExercises();
    } catch (error) {
      console.error('提交失败:', error);
    }
  };

  return (
    <div>
      <Table
        dataSource={pendingExercises}
        rowKey="id"
        columns={[
          { title: '题目ID', dataIndex: 'id' },
          { title: '一审意见', dataIndex: 'first_comment' },
          { title: '原分类', dataIndex: 'original_stage' },
          {
            title: '操作',
            render: (_, record) => (
              <Button onClick={() => setSelectedExercise(record)}>处理</Button>
            )
          }
        ]}
      />

      <Modal
        title="二审处理"
        visible={!!selectedExercise}
        onCancel={() => setSelectedExercise(null)}
        footer={null}
      >
        <Form layout="vertical">
          <Form.Item label="题目内容">
            <div dangerouslySetInnerHTML={{ __html: selectedExercise?.question }} />
          </Form.Item>
          
          <Form.Item label="阶段调整">
            <ReviewActions
              showStageAdjustment
              currentStage={selectedExercise?.first_id}
              onStageChange={setAdjustedStage}
              onApprove={() => handleSubmit(true)}
              onReject={() => handleSubmit(false)}
            />
          </Form.Item>

          <Form.Item label="审核意见">
            <Input.TextArea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SecondRoundReview;
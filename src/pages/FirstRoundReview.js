import React, { useState, useEffect } from 'react';
import { Table, Select, Button, Modal, Input, message, Image, Tag, Divider, Checkbox, Row, Col } from 'antd';
import ReactMarkdown from 'react-markdown';
import { api, getCategories, getFirstExercises, submitReview } from '../utils/api';

const answerToLetters = (answer, exerciseType) => {
    if (exerciseType === 2) { // 判断题
      return answer === '0' ? '正确' : '错误';
    }
    
    // 单选题或多选题
    return answer.split('').map(num => {
      const charCode = 65 + parseInt(num); // 0->A, 1->B, etc.
      return String.fromCharCode(charCode);
    }).join(', ');
};

// 根据题目类型判断阶段
const getExerciseStage = (exerciseType) => {
  if ([0, 1, 3].includes(exerciseType)) return '基础阶段';
  if ([4, 5].includes(exerciseType)) return '强化阶段';
  if (exerciseType === 6) return '真题阶段';
  return '未知阶段';
};

// 审核检查项配置
const CHECKLIST_ITEMS = [
  { label: '题目内容完整无误', key: 'content_complete' },
  { label: '选项设置合理', key: 'options_reasonable' },
  { label: '答案正确', key: 'answer_correct' },
  { label: '解析详尽准确', key: 'explanation_clear' },
  { label: '图片清晰且相关', key: 'images_clear' },
  { label: '符合阶段难度', key: 'stage_appropriate' },
];

const FirstRoundReview = () => {
  const [categories, setCategories] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [comment, setComment] = useState('');
  const [stageValidation, setStageValidation] = useState(true);
  const [adjustedStage, setAdjustedStage] = useState(null);
  const [checklist, setChecklist] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCategories().then(res => setCategories(res.data));
  }, []);

  const loadExercises = (firstId) => {
    getFirstExercises(firstId).then(res => setExercises(res.data)).catch(err => message.error('加载题目失败'));
  };

  const handleChecklistChange = (key, checked) => {
    setChecklist(prev => ({ ...prev, [key]: checked }));
  };

  const submitWithValidation = async () => {
    try {
      await api.post('/examine/update_stage', {
        exercise_id: selectedExercise.id,
        new_stage: adjustedStage
      });
      
      await submitReview({
        exercise_id: selectedExercise.id,
        comment,
        is_first_round: 1,
        requires_second_review: true
      });

      loadExercises(selectedCategory);
      setSelectedExercise(null);
      message.success('已提交二审流程');
      resetAfterSubmit();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleSubmit = async () => {
    // 检查是否所有检查项都已完成
    const uncheckedItems = CHECKLIST_ITEMS.filter(item => !checklist[item.key]);
    if (uncheckedItems.length > 0) {
      message.warning(`请完成所有检查项: ${uncheckedItems.map(item => item.label).join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      if (!stageValidation) {
        await submitWithValidation();
      } else {
        await submitReview({
          exercise_id: selectedExercise.id,
          comment,
          is_first_round: 1
        });
        message.success('审核提交成功');
        resetAfterSubmit();
      }
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  const resetAfterSubmit = () => {
    loadExercises(selectedCategory);
    setSelectedExercise(null);
    setComment('');
    setChecklist({});
    setLoading(false);
  };

  const renderOptions = (exercise) => {
    if (!exercise.options) return null;

    const options = exercise.options.split('~+~');
    
    return options.map((option, index) => (
        <div style={{ marginBottom: 8 }}>
        <Tag color="blue" style={{ display: 'inline-block', verticalAlign: 'top' }}>
            {String.fromCharCode(65 + index)}
        </Tag>
        <div style={{ display: 'inline-block', marginLeft: 8 }}>
            <ReactMarkdown>{option}</ReactMarkdown>
        </div>
        </div>
    ));
  };

  const renderComments = (exercise) => {
    return (
      <>
        <Divider orientation="left">答案解析</Divider>
        <ReactMarkdown>{exercise.comments}</ReactMarkdown>
        {exercise.comment_img && (
          <Image src={exercise.comment_img} style={{ marginTop: 16 }} />
        )}
      </>
    );
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
      <Select
        style={{ width: 160, marginBottom: 16, marginRight:30 }}
        placeholder="选择学科分类"
        onChange={value => {
          setSelectedCategory(value);
          loadExercises(value);
        }}
        options={categories.map(c => ({ value: c.id, label: c.name }))}
      />

      <Table
        style={{ width: '80%' }}
        size="middle"
        dataSource={exercises}
        rowKey="id"
        columns={[
          { title: '题目ID', dataIndex: 'id', width: 100 },
          { 
            title: '题目内容', 
            dataIndex: 'question',
            width: 300,
            render: (text) => <div style={{ maxWidth: 600 }}>{text}</div>
          },
          {
            title: '题目阶段',
            dataIndex: 'exercise_type',
            render: (type) => {
              return <Tag color={type === 6 ? 'red' : type >= 4 ? 'orange' : 'green'}>
                {getExerciseStage(type)}
              </Tag>;
            }
          },
          {
            title: '操作',
            width: 80,
            render: (_, record) => (
              <Button onClick={() => setSelectedExercise(record)}>审核</Button>
            )
          }
        ]}
      />

      <Modal
        title={`题目审核 (ID: ${selectedExercise?.id})`}
        width={800}
        visible={!!selectedExercise}
        onCancel={() => setSelectedExercise(null)}
        footer={[
            <Button key="reject" danger disabled={loading}>拒绝</Button>,
            <Button key="approve" type="primary" loading={loading} onClick={handleSubmit}>通过</Button>
        ]}
      >
        {selectedExercise && (
          <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ marginBottom: 16 }}>
              <Tag color="purple">题型: {['单选题', '多选题', '判断题'][selectedExercise.exercise_type]}</Tag>
              <Tag color={selectedExercise.exercise_type === 6 ? 'red' : selectedExercise.exercise_type >= 4 ? 'orange' : 'green'}>
                阶段: {getExerciseStage(selectedExercise.exercise_type)}
              </Tag>
            </div>

            <Divider orientation="left">题目内容</Divider>
            <ReactMarkdown>{selectedExercise.question}</ReactMarkdown>
            {selectedExercise.question_img && (
              <Image src={selectedExercise.question_img} style={{ marginTop: 16 }} />
            )}

            <Divider orientation="left">选项</Divider>
            {renderOptions(selectedExercise)}

            <Divider orientation="left">正确答案</Divider>
            <div style={{ fontSize: 16, fontWeight: 'bold' }}>
                {answerToLetters(selectedExercise.answer, selectedExercise.exercise_type)}
            </div>

            {renderComments(selectedExercise)}

            <Divider orientation="left">审核检查表</Divider>
            <Row gutter={[16, 16]}>
              {CHECKLIST_ITEMS.map(item => (
                <Col span={12} key={item.key}>
                  <Checkbox
                    checked={!!checklist[item.key]}
                    onChange={e => handleChecklistChange(item.key, e.target.checked)}
                  >
                    {item.label}
                  </Checkbox>
                </Col>
              ))}
            </Row>

            <Divider orientation="left">阶段调整</Divider>
            <Select
              style={{ width: '100%', marginBottom: 16 }}
              defaultValue={selectedExercise.first_id}
              onChange={value => {
                setAdjustedStage(value);
                setStageValidation(value === selectedExercise.first_id);
              }}
              options={categories.map(c => ({ value: c.id, label: c.name }))}
            />

            <Divider orientation="left">审核意见</Divider>
            <Input.TextArea
              rows={4}
              placeholder="请输入审核意见"
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FirstRoundReview;
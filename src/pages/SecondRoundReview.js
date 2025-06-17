import React, { useState, useEffect } from 'react';
import { Table, Modal, Input, Button, Tag, Divider, Checkbox, Row, Col, Image, message, Select } from 'antd';
import ReactMarkdown from 'react-markdown';
import { api, getCategories } from '../utils/api';

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

const getExerciseStage = (exerciseType) => {
  if ([0, 1, 2, 3].includes(exerciseType)) return '基础阶段';
  if ([4, 5].includes(exerciseType)) return '强化阶段';
  if (exerciseType === 6) return '真题阶段';
  return '未知阶段';
};

const STAGE_OPTIONS = [
  { value: 'basic', label: '基础阶段' },
  { value: 'intensive', label: '强化阶段' },
  { value: 'real', label: '真题阶段' },
];

const CHECKLIST_ITEMS = [
  { label: '题目内容完整', key: 'content_complete' },
  { label: '选项合理', key: 'options_reasonable' },
  { label: '答案正确', key: 'answer_correct' },
  { label: '解析清晰', key: 'explanation_clear' },
  { label: '图片清晰', key: 'images_clear' },
  { label: '一审意见已处理', key: 'first_comment_handled' },
];

const SecondRoundReview = () => {
  const [pendingExercises, setPendingExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [comment, setComment] = useState('');
  const [adjustedStage, setAdjustedStage] = useState(null);
  const [checklist, setChecklist] = useState({});
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    getCategories().then(res => setCategories(res.data));
  }, []);

  const loadSecondRoundExercises = async (categoryId = null) => {
    try {
      setLoading(true);
      const params = categoryId ? { category_id: categoryId } : {};
      const res = await api.get('/exercise/get_exercise_by_firstID_second_stage', { params });
      setPendingExercises(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      message.error('加载二审题目失败');
      setPendingExercises([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChecklistChange = (key, checked) => {
    setChecklist(prev => ({ ...prev, [key]: checked }));
  };

  const handleSubmit = async (isApproved) => {
    const uncheckedItems = CHECKLIST_ITEMS.filter(item => !checklist[item.key]);
    if (uncheckedItems.length > 0) {
      message.warning(`请完成所有检查项: ${uncheckedItems.map(item => item.label).join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      await api.post('/examine/insert_second_examine_record', {
        exercise_id: selectedExercise.id,
        comment,
        adjusted_stage: adjustedStage,
        valid: isApproved ? 1 : 0
      });
      
      message.success('审核提交成功');
      setSelectedExercise(null);
      loadSecondRoundExercises(selectedCategory);
      resetForm();
    } catch (error) {
      message.error('提交失败');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setComment('');
    setAdjustedStage(null);
    setChecklist({});
  };

  const renderOptions = (exercise) => {
    if (!exercise.options) return null;

    const options = exercise.options.split('~+~');
    
    return options.map((option, index) => (
      <div style={{ marginBottom: 8 }} key={index}>
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
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <Select
          style={{ width: 160, marginRight: 16 }}
          placeholder="选择学科分类"
          onChange={value => {
            setSelectedCategory(value);
            loadSecondRoundExercises(value);
          }}
          options={categories.map(c => ({ value: c.id, label: c.name }))}
          allowClear
        />
        <Button 
          onClick={() => {
            setSelectedCategory(null);
            loadSecondRoundExercises();
          }}
        >
          重置筛选
        </Button>
      </div>

      <Table
        loading={loading}
        style={{ width: '100%' }}
        size="middle"
        dataSource={pendingExercises}
        rowKey="id"
        columns={[
          { title: '题目ID', dataIndex: 'id', width: 100 },
          { 
            title: '题目内容', 
            dataIndex: 'question',
            render: (text) => <div style={{ maxWidth: 600 }}>{text}</div>
          },
          {
            title: '当前阶段',
            dataIndex: 'exercise_type',
            width: 120,
            render: (type) => (
              <Tag color={type === 6 ? 'red' : type >= 4 ? 'orange' : 'green'}>
                {getExerciseStage(type)}
              </Tag>
            )
          },
          {
            title: '一审意见',
            dataIndex: 'first_comment',
            render: (text) => text || '无'
          },
          {
            title: '操作',
            width: 120,
            render: (_, record) => (
              <Button type="primary" onClick={() => setSelectedExercise(record)}>
                审核
              </Button>
            )
          }
        ]}
      />

      <Modal
        title={`题目二审 (ID: ${selectedExercise?.id})`}
        width={800}
        visible={!!selectedExercise}
        onCancel={() => {
          setSelectedExercise(null);
          resetForm();
        }}
        footer={[
          <Button 
            key="reject" 
            danger 
            loading={loading}
            onClick={() => handleSubmit(false)}
          >
            拒绝
          </Button>,
          <Button 
            key="approve" 
            type="primary" 
            loading={loading}
            onClick={() => handleSubmit(true)}
          >
            通过
          </Button>
        ]}
      >
        {selectedExercise && (
          <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {/* 一审信息展示 */}
            <Divider orientation="left">一审信息</Divider>
            <div style={{ marginBottom: 16 }}>
              <p><strong>一审意见:</strong> {selectedExercise.first_comment || '无'}</p>
              {selectedExercise.first_stage_suggestion && (
                <p><strong>阶段建议:</strong> {selectedExercise.first_stage_suggestion}</p>
              )}
            </div>

            {/* 题目详情 */}
            <Divider orientation="left">题目详情</Divider>
            <div style={{ marginBottom: 16 }}>
              <Tag color="purple">题型: 单选题</Tag>
              <Tag color={selectedExercise.exercise_type === 6 ? 'red' : selectedExercise.exercise_type >= 4 ? 'orange' : 'green'}>
                当前阶段: {getExerciseStage(selectedExercise.exercise_type)}
              </Tag>
            </div>

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

            {/* 审核检查表 */}
            <Divider orientation="left">二审检查表</Divider>
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

            {/* 阶段调整 */}
            <Divider orientation="left">阶段调整</Divider>
            <Select
              style={{ width: '100%', marginBottom: 16 }}
              placeholder="选择调整后的阶段（如不调整请留空）"
              value={adjustedStage}
              onChange={setAdjustedStage}
              options={STAGE_OPTIONS}
            />

            {/* 审核意见 */}
            <Divider orientation="left">二审意见</Divider>
            <Input.TextArea
              rows={4}
              placeholder="请输入二审意见"
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SecondRoundReview;
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
  if ([0, 1, 2, 3].includes(exerciseType)) return '基础阶段';
  if ([4, 5].includes(exerciseType)) return '强化阶段';
  if (exerciseType === 6) return '真题阶段';
  if (exerciseType === 10) return '专项基础阶段';
  if (exerciseType === 11) return '专项强化阶段';
  if (exerciseType === 12) return '专项冲刺阶段';
  return '未知阶段';
};

const getStageLabel = (value) => {
    const option = STAGE_OPTIONS.find(opt => opt.value === value);
    return option ? option.label : '';
  };

const STAGE_OPTIONS = [
    { value: 'keep', label: '不调整（保持原阶段）' },
    { value: 'basic', label: '基础阶段' },
    { value: 'intensive', label: '强化阶段' },
    { value: 'real', label: '真题阶段' },
];

// 审核检查项配置
const CHECKLIST_ITEMS = [
  { label: '题目内容检查', key: 'content_complete' },
  { label: '选项内容检查', key: 'options_reasonable' },
  { label: '答案核实', key: 'answer_correct' },
  { label: '解析内容检查', key: 'explanation_clear' },
  { label: '图片检查', key: 'images_clear' },
];

const FirstRoundReview = () => {
  const [categories, setCategories] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [comment, setComment] = useState('');
  const [stageValidation, setStageValidation] = useState(true);
  const [adjustedStage, setAdjustedStage] = useState('keep');
  const [checklist, setChecklist] = useState({});
  const [loading, setLoading] = useState(false);
  

  useEffect(() => {
    getCategories().then(res => setCategories(res.data));
  }, []);

  const loadExercises = (firstId) => {
    getFirstExercises(firstId)
      .then(res => {
        // 确保数据是数组，如果不是则设置为空数组
        const data = Array.isArray(res.data) ? res.data : [];
        setExercises(data);
        if (data.length === 0) {
          message.info('该科目暂无待审核题目');
        }
      })
      .catch(err => {
        message.error('加载题目失败');
        setExercises([]); // 出错时也设置为空数组
      });
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

  const handleSubmit = async (isApproved) => {
    // 检查是否所有检查项都已完成
    const uncheckedItems = CHECKLIST_ITEMS.filter(item => !checklist[item.key]);
    if (uncheckedItems.length > 0) {
      message.warning(`请完成所有检查项: ${uncheckedItems.map(item => item.label).join(', ')}`);
      return;
    }

    let fullComment = comment;
    if (adjustedStage !== 'keep') {
        fullComment = `${comment}\n\n阶段调整建议: ${getStageLabel(adjustedStage)}`;
        isApproved = false; // 阶段调整时默认不通过
    }

    setLoading(true);
    try {
      if (!stageValidation) {
        await submitWithValidation();
      } else {
        await submitReview({
          exercise_id: selectedExercise.id,
          comment: fullComment,
          is_first_round: 1,
          valid: isApproved ? 1:0, // 1表示通过，0表示拒绝
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

    if(exercise.option_type === 1) {
      return (
        <div style={{ display: 'flex', gap: 8 }}>
          {exercise.options.split('~+~').map((_, index) => (
            <Tag key={index} color="blue">
              {String.fromCharCode(65 + index)}
            </Tag>
          ))}
        </div>
      )
    }

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
        {exercise.option_type !== 1 && <ReactMarkdown>{exercise.comments}</ReactMarkdown>}
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
        dataSource={exercises || {}}
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
        <Button 
        key="reject" 
        danger 
        loading={loading}
        onClick={() => handleSubmit(false)} // 传递false表示拒绝
        >
        拒绝
        </Button>,
        <Button 
        key="approve" 
        type="primary" 
        loading={loading} 
        onClick={() => handleSubmit(true)} // 传递true表示通过
        >
        通过
        </Button>
    ]}
    >
        {selectedExercise && (
          <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ marginBottom: 16 }}>
              <Tag color="purple">题型: {['单选题', '多选题', '判断题'][selectedExercise?.exercise_type]}</Tag>
              <Tag color={selectedExercise?.exercise_type === 6 ? 'red' : selectedExercise?.exercise_type >= 4 ? 'orange' : 'green'}>
                阶段: {getExerciseStage(selectedExercise?.exercise_type)}
              </Tag>
            </div>

            <Divider orientation="left">题目内容</Divider>
            {selectedExercise?.option_type !== 1 && <ReactMarkdown>{selectedExercise?.question}</ReactMarkdown>}
            {selectedExercise?.question_img && (
              <Image src={selectedExercise?.question_img} style={{ marginTop: 16 }} />
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

            <Divider orientation="left">阶段调整建议（调整后该题目将不通过审核）</Divider>
            <Select
              style={{ width: '100%', marginBottom: 16 }}
              value={adjustedStage}
              onChange={setAdjustedStage}
              options={STAGE_OPTIONS}
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
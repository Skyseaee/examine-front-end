import React from 'react';
import { Button, Select, Space } from 'antd';

const ReviewActions = ({ 
  onApprove, 
  onReject, 
  showStageAdjustment,
  currentStage,
  onStageChange
}) => {
  return (
    <Space>
      {showStageAdjustment && (
        <Select
          defaultValue={currentStage}
          onChange={onStageChange}
          style={{ width: 200 }}
          options={[
            { label: '基础阶段', value: 1 },
            { label: '强化阶段', value: 2 },
            { label: '冲刺阶段', value: 3 }
          ]}
        />
      )}
      <Button danger onClick={onReject}>驳回</Button>
      <Button type="primary" onClick={onApprove}>通过</Button>
    </Space>
  );
};

export default ReviewActions;
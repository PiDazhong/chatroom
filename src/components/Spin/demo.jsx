import React from 'react';
import Spin from './index';
import './demo.scss';

const MemoEl = () => {
  return (
    <div className="spin-demo">
      <Spin loading={true} />
    </div>
  );
};

export default MemoEl;
